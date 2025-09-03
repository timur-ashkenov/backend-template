import { HttpHeaders } from '../../MoySkladTypes';

export class HTTPService {
    static buildQuery(params?: Record<string, any>): string {
        if (!params || typeof params !== 'object') return '';

        const parts: string[] = [];
        for (const [key, value] of Object.entries(params)) {
            if (value == null) continue;

            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item == null) continue;
                    parts.push(
                        `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
                    );
                }
            } else {
                parts.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
                );
            }
        }
        return parts.join('&');
    }
    static pickErrorMessage(data: any, statusText: string): string {
        if (data && typeof data === 'object') {
            return (
                data?.errors?.[0]?.error ||
                data?.errors?.[0]?.message ||
                data?.message ||
                data?.error ||
                statusText ||
                ''
            );
        }
        return statusText || '';
    }
}
