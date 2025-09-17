import { AuthError, RateLimitError, ServerError, HttpError } from '../../MoySkladApi/MoySkladErrors';
import { HttpStatus } from '../../MoySkladApi/MoySkladTypes';

export function classifyAndThrow(
  status: number,
  message: string,
  retryAfterMs?: number
): never {
  if (status === HttpStatus.UNAUTHORIZED) {
    throw new AuthError(message, HttpStatus.UNAUTHORIZED);
  }

  if (status === HttpStatus.TOO_MANY_REQUESTS) {
    throw new RateLimitError(message, retryAfterMs);
  }
  
  if (
    status >= HttpStatus.INTERNAL_SERVER_ERROR &&
    status <= HttpStatus.NETWORK_CONNECT_TIMEOUT_ERROR
  ) {
    throw new ServerError(status, message);
  }
  throw new HttpError(status, message);
}
