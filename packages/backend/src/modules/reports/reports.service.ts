/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../../config/database.js';

interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  clientId?: string;
  projectId?: string;
}

type ByProjectEntry = {
  project: { id: string; name: string; color: string; hourlyRate: number | null; clientId: string | null };
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
  totalAmount: number;
};

export async function getSummary(userId: string, dateFrom: string, dateTo: string, clientId?: string, projectId?: string) {
  const where: any = {
    userId,
    date: {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    },
  };
  if (projectId) where.projectId = projectId;
  if (clientId) where.project = { clientId };

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      project: {
        select: { id: true, name: true, color: true, hourlyRate: true, clientId: true },
      },
    },
  });

  const totalMinutes = entries.reduce((sum: number, e: any) => sum + (e.duration ?? 0), 0);
  const totalHours = totalMinutes / 60;

  const byProject: Record<string, ByProjectEntry> = {};
  for (const entry of entries as any[]) {
    const key = entry.projectId as string;
    if (!byProject[key]) {
      byProject[key] = {
        project: entry.project,
        totalMinutes: 0,
        totalHours: 0,
        entryCount: 0,
        totalAmount: 0,
      };
    }
    byProject[key].totalMinutes += (entry.duration as number) ?? 0;
    byProject[key].totalHours = byProject[key].totalMinutes / 60;
    byProject[key].entryCount += 1;
    if (entry.project.hourlyRate) {
      byProject[key].totalAmount = byProject[key].totalHours * (entry.project.hourlyRate as number);
    }
  }

  return {
    period: { from: dateFrom, to: dateTo },
    totalMinutes,
    totalHours: Math.round(totalHours * 100) / 100,
    totalEntries: entries.length,
    byProject: Object.values(byProject),
  };
}

export async function getProjectReport(userId: string, projectId: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { userId, projectId },
    orderBy: { date: 'desc' },
  });

  const totalMinutes = entries.reduce((sum: number, e: any) => sum + (e.duration ?? 0), 0);

  return {
    projectId,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    totalEntries: entries.length,
    entries,
  };
}

export async function exportCsv(userId: string, filters: ExportFilters): Promise<string> {
  const where: any = {
    userId,
    date: {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo),
    },
  };
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.clientId) where.project = { clientId: filters.clientId };

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      project: {
        select: { name: true, client: { select: { name: true, company: true } } },
      },
    },
    orderBy: { date: 'asc' },
  });

  const header = 'Date,Client,Project,Description,Start,End,Duration (min),Duration (h)';
  const rows = (entries as any[]).map((e: any) => {
    const date = (e.date as Date).toISOString().split('T')[0];
    const start = (e.startTime as Date).toISOString();
    const end = e.endTime ? (e.endTime as Date).toISOString() : '';
    const hours = e.duration ? ((e.duration as number) / 60).toFixed(2) : '';
    const desc = ((e.description as string) ?? '').replace(/,/g, ';');
    const clientName = (e.project.client?.company ?? e.project.client?.name ?? '').replace(/,/g, ';');
    const projName = (e.project.name as string).replace(/,/g, ';');
    return `${date},${clientName},${projName},${desc},${start},${end},${e.duration ?? ''},${hours}`;
  });

  return [header, ...rows].join('\n');
}
