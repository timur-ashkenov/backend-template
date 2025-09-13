import { HttpStatus } from '../../MoySkladApi/MoySkladTypes';

export function isShouldRetry(status: number): boolean {
  if (status === HttpStatus.TOO_MANY_REQUESTS) return true;
  
  return (
    status >= HttpStatus.INTERNAL_SERVER_ERROR &&
    status <= HttpStatus.NETWORK_CONNECT_TIMEOUT_ERROR
  );
}
