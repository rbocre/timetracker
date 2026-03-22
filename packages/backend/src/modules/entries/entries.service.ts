import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/app-error.js';
import type { CreateEntryInput, UpdateEntryInput, TimerStartInput } from './entries.validator.js';

export async function getAll(
  userId: string,
  page = 1,
  limit = 20,
  projectId?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { userId };

  if (projectId) where.projectId = projectId;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  const [entries, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: { project: { select: { id: true, name: true, color: true } } },
      orderBy: { startTime: 'desc' },
      skip,
      take: limit,
    }),
    prisma.timeEntry.count({ where }),
  ]);

  return {
    entries,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string, userId: string) {
  const entry = await prisma.timeEntry.findFirst({
    where: { id, userId },
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  if (!entry) {
    throw AppError.notFound('Time entry not found');
  }

  return entry;
}

export async function create(userId: string, input: CreateEntryInput) {
  return prisma.timeEntry.create({
    data: {
      ...input,
      startTime: new Date(input.startTime),
      endTime: input.endTime ? new Date(input.endTime) : undefined,
      date: new Date(input.date),
      userId,
    },
    include: { project: { select: { id: true, name: true, color: true } } },
  });
}

export async function update(id: string, userId: string, input: UpdateEntryInput) {
  await getById(id, userId);

  const data: Record<string, unknown> = { ...input };
  if (input.startTime) data.startTime = new Date(input.startTime);
  if (input.endTime) data.endTime = new Date(input.endTime);
  if (input.date) data.date = new Date(input.date);

  return prisma.timeEntry.update({
    where: { id },
    data,
    include: { project: { select: { id: true, name: true, color: true } } },
  });
}

export async function remove(id: string, userId: string) {
  await getById(id, userId);
  return prisma.timeEntry.delete({ where: { id } });
}

export async function startTimer(userId: string, input: TimerStartInput) {
  const now = new Date();
  return prisma.timeEntry.create({
    data: {
      description: input.description,
      startTime: now,
      date: now,
      projectId: input.projectId,
      userId,
    },
    include: { project: { select: { id: true, name: true, color: true } } },
  });
}

export async function checkOverlap(
  userId: string,
  projectId: string,
  startTime: string,
  endTime: string,
  excludeEntryId?: string,
) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const where: Record<string, unknown> = {
    userId,
    projectId,
    endTime: { not: null },
    AND: [
      { startTime: { lt: end } },
      { endTime: { gt: start } },
    ],
  };

  if (excludeEntryId) {
    (where as Record<string, unknown>).id = { not: excludeEntryId };
  }

  return prisma.timeEntry.findMany({
    where,
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: { startTime: 'asc' },
  });
}

export async function stopTimer(entryId: string, userId: string) {
  const entry = await getById(entryId, userId);

  if (entry.endTime) {
    throw AppError.badRequest('Timer already stopped');
  }

  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000);

  return prisma.timeEntry.update({
    where: { id: entryId },
    data: { endTime, duration },
    include: { project: { select: { id: true, name: true, color: true } } },
  });
}
