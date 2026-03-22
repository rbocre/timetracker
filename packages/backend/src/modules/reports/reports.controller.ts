import type { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dateFrom, dateTo, clientId, projectId } = req.query as {
      dateFrom: string;
      dateTo: string;
      clientId?: string;
      projectId?: string;
    };
    const summary = await reportsService.getSummary(
      req.user!.userId,
      dateFrom,
      dateTo,
      clientId || undefined,
      projectId || undefined,
    );
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

export async function getProjectReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const report = await reportsService.getProjectReport(req.user!.userId, req.params.id as string);
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dateFrom, dateTo, clientId, projectId } = req.query as {
      dateFrom: string;
      dateTo: string;
      clientId?: string;
      projectId?: string;
    };
    const csv = await reportsService.exportCsv(req.user!.userId, {
      dateFrom,
      dateTo,
      clientId: clientId || undefined,
      projectId: projectId || undefined,
    });

    let filename = `timetracker-export-${dateFrom}-${dateTo}`;
    if (clientId) filename += `-client-${clientId}`;
    if (projectId) filename += `-project-${projectId}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
