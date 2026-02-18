import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/app-error.js';
import type { CreateClientInput, UpdateClientInput } from './clients.validator.js';

export async function getAll(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where: { userId } }),
  ]);

  return {
    clients,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: { projects: { select: { id: true, name: true, isActive: true } } },
  });

  if (!client) {
    throw AppError.notFound('Client not found');
  }

  return client;
}

export async function create(userId: string, input: CreateClientInput) {
  return prisma.client.create({
    data: { ...input, userId },
  });
}

export async function update(id: string, userId: string, input: UpdateClientInput) {
  await getById(id, userId);

  return prisma.client.update({
    where: { id },
    data: input,
  });
}

export async function remove(id: string, userId: string) {
  await getById(id, userId);

  return prisma.client.update({
    where: { id },
    data: { isActive: false },
  });
}
