import type { Request, Response, NextFunction } from 'express';
import * as clientsService from './clients.service.js';
import { sendSuccess } from '../../shared/response.js';
import type { CreateClientInput, UpdateClientInput } from './clients.validator.js';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { clients, meta } = await clientsService.getAll(req.user!.userId, page, limit);
    sendSuccess(res, clients, 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await clientsService.getById(req.params.id as string, req.user!.userId);
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await clientsService.create(
      req.user!.userId,
      req.body as CreateClientInput,
    );
    sendSuccess(res, client, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await clientsService.update(
      req.params.id as string,
      req.user!.userId,
      req.body as UpdateClientInput,
    );
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clientsService.remove(req.params.id as string, req.user!.userId);
    sendSuccess(res, { message: 'Client deactivated' });
  } catch (err) {
    next(err);
  }
}
