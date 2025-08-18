import { NextFunction, Request, Response } from 'express';
import {
    BadRequestError,
    NotFoundError,
    ConflictError,
    UnprocessableEntityError,
} from '../errors';

export function errorHandler(
    error: unknown,
    request: Request,
    response: Response,
    _next: NextFunction
) {
    let status = 500;
    let message = 'Internal server error';

    if (error instanceof BadRequestError) {
        status = 400;
        message = error.message;
    } else if (error instanceof NotFoundError) {
        status = 404;
        message = error.message;
    } else if (error instanceof ConflictError) {
        status = 409;
        message = error.message;
    } else if (error instanceof UnprocessableEntityError) {
        status = 422;
        message = error.message;
    } else if (error instanceof Error) {
        message = error.message;
    }

    response.status(status).json({ error: message });
}
