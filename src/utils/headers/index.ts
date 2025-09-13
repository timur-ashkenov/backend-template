import type { THttpHeaders, IClientConfig } from '../../MoySkladApi/MoySkladTypes';
import { buildAuthHeader } from '../auth';

export function buildDefaultHeaders(config: IClientConfig): THttpHeaders {
  return {
    'accept-encoding': 'gzip',
    accept: 'application/json;charset=utf-8',
    ...buildAuthHeader(config),
  };
}
