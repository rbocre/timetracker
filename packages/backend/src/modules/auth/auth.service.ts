import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/app-error.js';
import type { RegisterInput, LoginInput } from './auth.validator.js';
import type { AuthPayload } from '../../middleware/auth.js';

const BCRYPT_ROUNDS = 12;

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as object);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
  } as object);

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw AppError.conflict('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      locale: input.locale ?? 'de',
    },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      createdAt: true,
    },
  });

  const tokens = generateTokens({ userId: user.id, email: user.email });

  return { user, ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(input.password, user.password);

  if (!validPassword) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
    },
    ...tokens,
  };
}

export function refreshAccessToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;
    const tokens = generateTokens({ userId: payload.userId, email: payload.email });
    return tokens;
  } catch {
    throw AppError.unauthorized('Invalid refresh token');
  }
}
