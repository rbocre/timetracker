import type { Request, Response, NextFunction } from 'express';
import * as entriesService from './entries.service.js';
import { sendSuccess } from '../../shared/response.js';
import type { CreateEntryInput, UpdateEntryInput, TimerStartInput } from './entries.validator.js';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { entries, meta } = await entriesService.getAll(
      req.user!.userId,
      page,
      limit,
      req.query.projectId as string | undefined,
      req.query.dateFrom as string | undefined,
      req.query.dateTo as string | undefined,
    );
    sendSuccess(res, entries, 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await entriesService.getById(req.params.id, req.user!.userId);
    sendSuccess(res, entry);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await entriesService.create(req.user!.userId, req.body as CreateEntryInput);
    sendSuccess(res, entry, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await entriesService.update(
      req.params.id,
      req.user!.userId,
      req.body as UpdateEntryInput,
    );
    sendSuccess(res, entry);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await entriesService.remove(req.params.id, req.user!.userId);
    sendSuccess(res, { message: 'Entry deleted' });
  } catch (err) {
    next(err);
  }
}

export async function startTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await entriesService.startTimer(req.user!.userId, req.body as TimerStartInput);
    sendSuccess(res, entry, 201);
  } catch (err) {
    next(err);
  }
}

export async function stopTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await entriesService.stopTimer(req.params.id, req.user!.userId);
    sendSuccess(res, entry);
  } catch (err) {
    next(err);
  }
}
