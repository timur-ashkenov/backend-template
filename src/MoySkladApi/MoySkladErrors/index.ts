import { HttpStatus } from '../MoySkladTypes';

export class AuthError extends Error {
    status: HttpStatus.UNAUTHORIZED;
    constructor(
        message = 'Authentication/Authorization error',
        status: HttpStatus.UNAUTHORIZED
    ) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
    }
}

export class RateLimitError extends Error {
    status: HttpStatus.TOO_MANY_REQUESTS = HttpStatus.TOO_MANY_REQUESTS;
    retryAfterMs?: number;

    constructor(message = 'Rate limit exceeded', retryAfterMs?: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfterMs = retryAfterMs;
    }
}

export class ServerError extends Error {
    status: number;
    constructor(status: number, message = 'Upstream server error') {
        super(message);
        this.name = 'ServerError';
        this.status = status;
    }
}

export class HttpError extends Error {
    status: number;
    constructor(status: number, message = 'HTTP error') {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}
