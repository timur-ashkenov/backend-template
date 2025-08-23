export class HttpError extends Error {
    public readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BadRequestError extends HttpError {
    constructor(message = 'Bad request') {
        super(400, message);
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

export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}
