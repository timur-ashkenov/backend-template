import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors';

export function errorHandler(
    error: unknown,
    request: Request,
    response: Response,
    _next: NextFunction
) {
    if (error instanceof HttpError) {
        return response.status(error.status).json({ error: error.message });
    }

    console.error('[UNEXPECTED ERROR]', error);
    return response.status(500).json({ error: 'Internal server error' });
}
