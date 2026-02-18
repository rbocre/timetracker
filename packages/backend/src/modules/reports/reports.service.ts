import { prisma } from '../../config/database.js';

interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  clientId?: string;
  projectId?: string;
}

export async function getSummary(userId: string, dateFrom: string, dateTo: string, clientId?: string, projectId?: string) {
  const where: Record<string, unknown> = {
    userId,
    date: {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (clientId) {
    where.project = { clientId };
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      project: {
        select: { id: true, name: true, color: true, hourlyRate: true, clientId: true },
      },
    },
  });

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  const totalHours = totalMinutes / 60;

  const byProject = entries.reduce(
    (acc, entry) => {
      const key = entry.projectId;
      if (!acc[key]) {
        acc[key] = {
          project: entry.project,
          totalMinutes: 0,
          totalHours: 0,
          entryCount: 0,
          totalAmount: 0,
        };
      }
      acc[key].totalMinutes += entry.duration ?? 0;
      acc[key].totalHours = acc[key].totalMinutes / 60;
      acc[key].entryCount += 1;
      if (entry.project.hourlyRate) {
        acc[key].totalAmount = acc[key].totalHours * entry.project.hourlyRate;
      }
      return acc;
    },
    {} as Record<
      string,
      {
        project: { id: string; name: string; color: string; hourlyRate: number | null };
        totalMinutes: number;
        totalHours: number;
        entryCount: number;
        totalAmount: number;
      }
    >,
  );

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

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);

  return {
    projectId,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    totalEntries: entries.length,
    entries,
  };
}

export async function exportCsv(userId: string, filters: ExportFilters): Promise<string> {
  const where: Record<string, unknown> = {
    userId,
    date: {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo),
    },
  };

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.clientId) {
    where.project = { clientId: filters.clientId };
  }

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
  const rows = entries.map((e) => {
    const date = e.date.toISOString().split('T')[0];
    const start = e.startTime.toISOString();
    const end = e.endTime?.toISOString() ?? '';
    const hours = e.duration ? (e.duration / 60).toFixed(2) : '';
    const desc = (e.description ?? '').replace(/,/g, ';');
    const clientName = (e.project.client?.company ?? e.project.client?.name ?? '').replace(/,/g, ';');
    const projName = e.project.name.replace(/,/g, ';');
    return `${date},${clientName},${projName},${desc},${start},${end},${e.duration ?? ''},${hours}`;
  });

  return [header, ...rows].join('\n');
}
