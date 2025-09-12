import {
    mergeAbortSignals,
    safeJson,
    tryParseJson,
    collectAbortSignals,
} from '../../../utils/httpUtils';
import {
    HTTP_STATUS_NO_CONTENT,
    HTTP_STATUS_NOT_MODIFIED,
    HEADER_CONTENT_TYPE,
    MIME_APPLICATION_JSON,
    REGEX_TRAILING_SLASHES,
    EMPTY_STATUS_TEXT,
} from '../../../utils/constants';
import { THttpHeaders, TRequestArgs, IHttpResponse } from '../../MoySkladTypes';

export class HttpService {
    static toLowercaseHeaders<T extends Record<string, unknown>>(
        headers: T
    ): Record<string, any> {
        const lowered: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(headers)) {
            lowered[key.toLowerCase()] = value;
        }

        return lowered;
    }

    static async requestWithJson<T = unknown>({
        url,
        method,
        headers,
        body,
        timeoutMs,
        signal,
    }: TRequestArgs): Promise<IHttpResponse<T>> {
        const controller = new AbortController();

        const signals = collectAbortSignals(controller.signal, signal);

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (typeof timeoutMs === 'number' && timeoutMs > 0) {
            timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        }

        const requestHeaders = HttpService.toLowercaseHeaders(headers ?? {});

        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ?? null,
            signal: mergeAbortSignals(signals),
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
            data = await safeJson(response);
        }

        if (!contentType.includes(MIME_APPLICATION_JSON)) {
            const text = await response.text();

            data = tryParseJson(text) ?? text ?? null;
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
            data?.errors?.[0]?.error ||
            data?.errors?.[0]?.message ||
            data?.message ||
            data?.error ||
            statusText ||
            EMPTY_STATUS_TEXT
        );
    }
}
