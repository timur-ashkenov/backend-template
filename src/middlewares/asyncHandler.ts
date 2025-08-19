import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (fn: (request: Request, response: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
