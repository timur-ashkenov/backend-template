import { NextFunction, Request, Response } from 'express';
import {
    BadRequestError,
    NotFoundError,
    ConflictError,
    UnprocessableEntityError,
    UnauthorizedError,
} from '../errors';

export function errorHandler(
    error: unknown,
    request: Request,
    response: Response,
    _next: NextFunction
) {
    let status = 500;
    let message = 'Internal server error';

    switch (true) {
        case error instanceof BadRequestError:
            status = 400;
            message = error.message;
            break;
        case error instanceof NotFoundError:
            status = 404;
            message = error.message;
            break;
        case error instanceof ConflictError:
            status = 409;
            message = error.message;
            break;
        case error instanceof UnprocessableEntityError:
            status = 422;
            message = error.message;
            break;
        case error instanceof Error:
            message = error.message;
            break;
        case error instanceof Error:
            message = error.message;
            break;
    }

    response.status(status).json({ error: message });
}
