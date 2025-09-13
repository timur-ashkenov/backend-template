import { THttpHeaders, TRequestArgs, IHttpResponse } from '../../MoySkladTypes';

export class HTTPService {
    static async requestWithJson<T = unknown>({
        url,
        method,
        headers,
        body,
        timeoutMs,
        signal,
    }: TRequestArgs): Promise<IHttpResponse<T>> {
        const controller = new AbortController();

        const signals: AbortSignal[] = [controller.signal];

        if (signal) signals.push(signal);

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (typeof timeoutMs === 'number' && timeoutMs > 0) {
            timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        }

        const reqHeaders = HTTPService.toLowercaseHeaders(headers ?? {});

        const resp = await fetch(url, {
            method,
            headers: reqHeaders,
            body: body ?? null,
            signal: mergeAbortSignals(signals),
        }).finally(() => {
            if (timeoutId) clearTimeout(timeoutId);
        });

        const rawHeaders = Object.fromEntries(resp.headers.entries());

        const normalizedHeaders = HTTPService.toLowercaseHeaders(rawHeaders);

        const contentType = normalizedHeaders['content-type'] || '';

        let data: any = null;

        if (resp.status !== 204 && resp.status !== 304) {
            if (contentType.includes('application/json')) {
                data = await safeJson(resp);
            } else {
                const text = await resp.text();
                data = tryParseJson(text) ?? text ?? null;
            }
        }

        return {
            status: resp.status,
            statusText: resp.statusText || '',
            headers: normalizedHeaders as THttpHeaders,
            data: data as T,
        };
    }

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

    static buildUrl(
        base: string,
        path: string,
        params?: Record<string, any>
    ): string {
        const normalizedBase = (base || '').replace(/\/+$/, '');

        const normalizedPath = path.startsWith('/') ? path : `/${path}`;

        const qs = HTTPService.buildQuery(params);

        return qs
            ? `${normalizedBase}${normalizedPath}?${qs}`
            : `${normalizedBase}${normalizedPath}`;
    }

    static pickErrorMessage(data: any, statusText?: string): string {
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

    static toLowercaseHeaders<T extends Record<string, unknown>>(
        headers: T
    ): Record<string, any> {
        const lowered: Record<string, any> = {};

        for (const [key, value] of Object.entries(headers))
            lowered[key.toLowerCase()] = value;

        return lowered;
    }
}

async function safeJson(r: Response): Promise<any> {
    try {
        return await r.json();
    } catch {
        const text = await r.text().catch(() => '');

        return tryParseJson(text) ?? text ?? null;
    }
}

function tryParseJson(string: string): any | null {
    try {
        return JSON.parse(string);
    } catch {
        return null;
    }
}

function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
    if (signals.length === 1) return signals[0];

    const controller = new AbortController();

    const onAbort = () => controller.abort();

    for (const s of signals) {
        if (s.aborted) {
            controller.abort();
            break;
        }
        s.addEventListener('abort', onAbort, { once: true });
    }

    return controller.signal;
}
