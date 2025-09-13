import { HTTPService } from '../../MoySkladApi/MoySkladServices/HTTPService';
import type { TRelativePath } from '../../MoySkladApi/MoySkladTypes';
import { RE_TRAILING_SLASHES } from '../constants';

export function buildUrl(
    baseURL: string,
    path: TRelativePath,
    params?: Record<string, unknown>
): string {
    const base = (baseURL || '').replace(RE_TRAILING_SLASHES, '');

    const queryString = HTTPService.buildQuery(params);

    const url = `${base}/${path}`;

    return queryString ? `${url}?${queryString}` : url;
}

export const safeGetHostname = (urlLike: string): string | null => {
    try {
        return new URL(urlLike).hostname.toLowerCase();
    } catch {
        return null;
    }
};
