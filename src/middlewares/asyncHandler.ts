import { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(
    handler: (
        request: Request,
        response: Response,
        next: NextFunction
    ) => Promise<unknown>
): RequestHandler {
    return async function wrapped(request, response, next) {
        try {
            await handler(request, response, next);
        } catch (error) {
            next(error);
        }
    };
}
