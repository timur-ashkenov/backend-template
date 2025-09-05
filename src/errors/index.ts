export class HttpError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message);

        this.name = new.target.name;

        Object.setPrototypeOf(this, new.target.prototype);

        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, new.target);
        }
    }
}

export class AuthError extends HttpError {
    constructor(message = 'Unauthorized', status: number = 401) {
        super(status, message);
        this.name = 'AuthError'
    }
}

export class RateLimitError extends HttpError {
    constructor(
        message = 'Too Many Requests',
        public readonly retryAfterMs?: number
    ) {
        super(429, message);
    }
}

export class ServerError extends HttpError {
    constructor(status: number, message = 'Upstream server error') {
        super(status === 0 ? 502 : status, message);
    }
}

export class BadRequestError extends HttpError {
    constructor(message = 'Bad request') {
        super(400, message);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

export class NotFoundError extends HttpError {
    constructor(message = 'Not found') {
        super(404, message);
    }
}

export class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}

export class UnprocessableEntityError extends HttpError {
    constructor(message = 'Unprocessable entity') {
        super(422, message);
    }
}
