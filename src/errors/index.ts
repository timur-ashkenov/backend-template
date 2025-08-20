export class BadRequestError extends Error {
    constructor(message = 'Bad request') {
        super(message);

        this.name = 'BadRequestError';
    }
}

export class NotFoundError extends Error {
    constructor(message = 'Not found') {
        super(message);

        this.name = 'NotFoundError';
    }
}

export class UnprocessableEntityError extends Error {
    constructor(message = 'Unprocessable entity') {
        super(message);

        this.name = 'UnprocessableEntityError';
    }
}

export class ConflictError extends Error {
    constructor(message = 'Conflict') {
        super(message);

        this.name = 'ConflictError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);

        this.name = 'UnauthorizedError';
    }
}
