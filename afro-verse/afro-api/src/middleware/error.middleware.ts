import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Error Handling Middleware
 * 
 * Catches all errors and formats responses consistently.
 */

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'internal_error';
  
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  
  // Don't leak error details in production
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;
  
  // Send error response
  res.status(statusCode).json({
    error: errorCode,
    message,
    ...(env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
}

/**
 * Create operational error
 */
export function createError(
  message: string,
  statusCode: number = 400,
  code: string = 'error'
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
}

/**
 * Async handler wrapper
 * 
 * Wraps async route handlers to catch errors automatically.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

