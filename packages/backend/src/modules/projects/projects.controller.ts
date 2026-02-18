import type { Request, Response, NextFunction } from 'express';
import * as projectsService from './projects.service.js';
import { sendSuccess } from '../../shared/response.js';
import type { CreateProjectInput, UpdateProjectInput } from './projects.validator.js';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { projects, meta } = await projectsService.getAll(req.user!.userId, page, limit);
    sendSuccess(res, projects, 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectsService.getById(req.params.id, req.user!.userId);
    sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectsService.create(req.user!.userId, req.body as CreateProjectInput);
    sendSuccess(res, project, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectsService.update(
      req.params.id,
      req.user!.userId,
      req.body as UpdateProjectInput,
    );
    sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectsService.remove(req.params.id, req.user!.userId);
    sendSuccess(res, { message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
}
