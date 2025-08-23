export class AuthError extends Error {
  status: 401 | 403;
  constructor(message = "Authentication/Authorization error", status: 401 | 403 = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export class RateLimitError extends Error {
  status: 429 = 429;
  retryAfterMs?: number;
  constructor(message = "Rate limit exceeded", retryAfterMs?: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class ServerError extends Error {
  status: number;
  constructor(status: number, message = "Upstream server error") {
    super(message);
    this.name = "ServerError";
    this.status = status;
  }
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message = "HTTP error") {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
