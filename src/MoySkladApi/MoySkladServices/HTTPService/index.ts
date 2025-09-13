import { THttpHeaders, TRequestArgs, IHttpResponse } from '../../MoySkladTypes';
import {
    HTTP_STATUS_NO_CONTENT,
    HTTP_STATUS_NOT_MODIFIED,
    HEADER_CONTENT_TYPE,
    MIME_APPLICATION_JSON,
    REGEX_TRAILING_SLASHES,
    EMPTY_STATUS_TEXT,
} from '../../../utils/constants';

export class HttpService {
    static mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
        if (signals.length < 1) return new AbortController().signal;

        if (signals.length === 1) return signals[0];

        const controller = new AbortController();
        
        const onAbort = () => controller.abort();

        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort();

                return controller.signal;
            }
            signal.addEventListener('abort', onAbort, { once: true });
        }

        return controller.signal;
    }

    static collectAbortSignals(
        primary: AbortSignal,
        extra?: AbortSignal
    ): AbortSignal[] {
        if (!extra) return [primary];
        
        return [primary, extra];
    }

    static tryParseJson(input: string): unknown | null {
        try {
            return JSON.parse(input);
        } catch {
            return null;
        }
    }

    static async safeJson(response: Response): Promise<unknown> {
        try {
            return await response.json();
        } catch {
            const text = await response.text().catch(() => '');

            return HttpService.tryParseJson(text) ?? text ?? null;
        }
    }

    static toLowercaseHeaders<T extends Record<string, unknown>>(
        headers: T
    ): Record<string, any> {
        const lowered: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(headers)) {
            lowered[key.toLowerCase()] = value;
        }

        return lowered;
    }

    static async requestWithJson<T>({
        url,
        method,
        headers,
        body,
        timeoutMs,
        signal,
    }: TRequestArgs): Promise<IHttpResponse<T>> {
        const controller = new AbortController();

        const signals = this.collectAbortSignals(controller.signal, signal);

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (typeof timeoutMs === 'number' && timeoutMs > 0) {
            timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        }

        const requestHeaders = HttpService.toLowercaseHeaders(headers ?? {});

        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ?? null,
            signal: this.mergeAbortSignals(signals),
        }).finally(() => {
            if (!timeoutId) return;

            clearTimeout(timeoutId);
        });

        const rawHeaders = Object.fromEntries(response.headers.entries());

        const normalizedHeaders = HttpService.toLowercaseHeaders(rawHeaders);

        const contentType =
            normalizedHeaders[HEADER_CONTENT_TYPE] || EMPTY_STATUS_TEXT;

        let data: unknown = null;

        if (
            response.status === HTTP_STATUS_NO_CONTENT ||
            response.status === HTTP_STATUS_NOT_MODIFIED
        ) {
            return {
                status: response.status,
                statusText: response.statusText || EMPTY_STATUS_TEXT,
                headers: normalizedHeaders as THttpHeaders,
                data: null as T,
            };
        }

        if (contentType.includes(MIME_APPLICATION_JSON)) {
            data = await this.safeJson(response);
        }

        if (!contentType.includes(MIME_APPLICATION_JSON)) {
            const text = await response.text();

            data = this.tryParseJson(text) ?? text ?? null;
        }

        return {
            status: response.status,
            statusText: response.statusText || EMPTY_STATUS_TEXT,
            headers: normalizedHeaders as THttpHeaders,
            data: data as T,
        };
    }

    static buildQuery(params?: Record<string, unknown>): string {
        if (!params || typeof params !== 'object') return EMPTY_STATUS_TEXT;

        const parts: string[] = [];

        for (const [key, value] of Object.entries(params)) {
            if (value == null) continue;

            if (!Array.isArray(value)) {
                parts.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
                );

                continue;
            }

            for (const item of value) {
                if (item == null) continue;

                parts.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
                );
            }
        }

        return parts.join('&');
    }

    static buildUrl(
        base: string,
        path: string,
        params?: Record<string, unknown>
    ): string {
        const normalizedBase = (base || EMPTY_STATUS_TEXT).replace(
            REGEX_TRAILING_SLASHES,
            EMPTY_STATUS_TEXT
        );

        const normalizedPath = path.startsWith('/') ? path : `/${path}`;

        const queryString = HttpService.buildQuery(params);

        if (!queryString) return `${normalizedBase}${normalizedPath}`;

        return `${normalizedBase}${normalizedPath}?${queryString}`;
    }

    static pickErrorMessage(data: any, statusText?: string): string {
        if (!data || typeof data !== 'object') {
            return statusText || EMPTY_STATUS_TEXT;
        }

        return (
            String(data?.errors?.[0]?.error) ||
            String(data?.errors?.[0]?.message) ||
            String(data?.message) ||
            String(data?.error) ||
            statusText ||
            EMPTY_STATUS_TEXT
        );
    }
}
