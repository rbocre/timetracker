import type { ErrorRequestHandler } from 'express';
import { AppError } from '../shared/app-error.js';
import { sendError } from '../shared/response.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500);
};
