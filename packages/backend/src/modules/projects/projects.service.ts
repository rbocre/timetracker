import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/app-error.js';
import { sendTelegramMessage } from '../../shared/notify.js';
import type { CreateProjectInput, UpdateProjectInput } from './projects.validator.js';

export async function getAll(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      include: { client: { select: { id: true, name: true, company: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where: { userId } }),
  ]);

  return {
    projects,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: { client: { select: { id: true, name: true, company: true } } },
  });

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  return project;
}

export async function create(userId: string, input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: { ...input, userId },
    include: { client: { select: { id: true, name: true, company: true } } },
  });

  const clientInfo = project.client ? ` (client: ${project.client.name})` : '';
  sendTelegramMessage(
    `🆕 <b>New project created</b>\n` +
    `📁 <b>${project.name}</b>${clientInfo}\n` +
    `👤 User: <code>${userId}</code>`
  );

  return project;
}

export async function update(id: string, userId: string, input: UpdateProjectInput) {
  await getById(id, userId);

  return prisma.project.update({
    where: { id },
    data: input,
    include: { client: { select: { id: true, name: true, company: true } } },
  });
}

export async function remove(id: string, userId: string) {
  await getById(id, userId);

  return prisma.project.delete({
    where: { id },
  });
}
