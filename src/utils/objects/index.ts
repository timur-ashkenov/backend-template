import { THttpHeaders } from '../../MoySkladApi/MoySkladTypes';

export function getObjectInLowercase(raw: any): THttpHeaders {
  const out: THttpHeaders = {};

  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      if (value == null) continue;

      out[String(key).toLowerCase()] = Array.isArray(value)
        ? String(value[0])
        : String(value);
    }
  }

  return out;
}
