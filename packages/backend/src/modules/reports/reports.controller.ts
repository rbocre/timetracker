import type { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query as { dateFrom: string; dateTo: string };
    const summary = await reportsService.getSummary(req.user!.userId, dateFrom, dateTo);
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
    const report = await reportsService.getProjectReport(req.user!.userId, req.params.id);
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query as { dateFrom: string; dateTo: string };
    const csv = await reportsService.exportCsv(req.user!.userId, dateFrom, dateTo);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=timetracker-export-${dateFrom}-${dateTo}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
