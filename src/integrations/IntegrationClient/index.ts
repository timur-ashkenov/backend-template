// clients/MoySkladClient.ts
import {
    ClientConfig,
    HttpHeaders,
    HttpResponse,
    RelativePath,
    HttpStatus,
    HttpMethod,
} from '../IntegrationTypes';
import {
    AuthError,
    RateLimitError,
    ServerError,
    HttpError,
} from '../IntegrationErrors';
import { HTTPService } from '../../services/HTTPService';

export class MoySkladClient {
    constructor(private readonly config: ClientConfig) {}
    private toLowercaseHeaders(raw: any): HttpHeaders {
        const out: HttpHeaders = {};

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

    private buildUrl(
        baseURL: string,
        path: RelativePath,
        params?: Record<string, any>
    ): string {
        const querySet = HTTPService.buildQuery(params);

        const url = `${baseURL}/${path}`;

        return querySet ? `${url}?${querySet}` : url;
    }

    private parseRetryDelayMs(headers: HttpHeaders): number | null {
        const timeinterval = headers['x-lognex-retry-timeinterval'];
        if (timeinterval) {
            const ms = Number(timeinterval);
            if (Number.isFinite(ms) && ms >= 0) return ms;
        }

        const lognexAfter = headers['x-lognex-retry-after'];
        if (lognexAfter) {
            const sec = Number(lognexAfter);
            if (Number.isFinite(sec) && sec >= 0) return sec * 1000;
        }

        const retryAfter = headers['retry-after'];
        if (retryAfter) {
            const num = Number(retryAfter);
            if (Number.isFinite(num) && num >= 0) return num * 1000;

            const when = Date.parse(retryAfter);
            if (!Number.isNaN(when)) {
                const delta = when - Date.now();
                if (delta > 0) return delta;
            }
        }
        return null;
    }

    private shouldRetry(status: number): boolean {
        if (status === HttpStatus.TOO_MANY_REQUESTS) return true;
        if (
            status >= HttpStatus.INTERNAL_SERVER_ERROR &&
            status <= HttpStatus.NETWORK_CONNECT_TIMEOUT_ERROR
        )
            return true;

        return false;
    }

    private computeBackoffMs(
        status: number,
        headers: HttpHeaders,
        attempt: number
    ): number {
        const fromHeaders = this.parseRetryDelayMs(headers);

        if (
            status === HttpStatus.TOO_MANY_REQUESTS ||
            status === HttpStatus.SERVICE_UNAVAILABLE
        ) {
            if (fromHeaders != null) return fromHeaders;
            return Math.min(1000 * (attempt + 1), 3000);
        }

        const backoff = Math.min(150 * Math.pow(2, attempt), 1000);

        const jitter = Math.floor(Math.random() * 100);

        return backoff + jitter;
    }

    private classifyAndThrow(
        status: number,
        message: string,
        retryAfterMs?: number
    ): never {
        if (status === HttpStatus.UNAUTHORIZED) {
            throw new AuthError(message, status as HttpStatus.UNAUTHORIZED);
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

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private buildAuthHeader(): HttpHeaders {
        const { token, basic } = this.config;

        if (token && token.trim().length > 0) {
            const tokenBearer = token.trim();
            return {
                authorization: tokenBearer.toLowerCase().startsWith('bearer ')
                    ? tokenBearer
                    : `Bearer ${tokenBearer}`,
            };
        }
        if (basic?.user && basic?.pass) {
            const raw = `${basic.user}:${basic.pass}`;

            const encoded = Buffer.from(raw, 'utf8').toString('base64');

            return { authorization: `Basic ${encoded}` };
        }

        throw new AuthError('Missing credentials', HttpStatus.UNAUTHORIZED);
    }

    private buildDefaultHeaders(): HttpHeaders {
        return {
            'accept-encoding': 'gzip',
            accept: 'application/json;charset=utf-8',
            ...this.buildAuthHeader(),
        };
    }

    private async attemptOnce(
        url: string,
        method: HttpMethod,
        headers: HttpHeaders,
        timeoutMs: number
    ): Promise<{
        status: number;
        statusText: string;
        headers: HttpHeaders;
        data: any;
    }> {
        const controller = new AbortController();
        
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method,
                headers,
                signal: controller.signal,
            });

            const rawHeaders = Object.fromEntries(response.headers.entries());

            const normalizedHeaders = this.toLowercaseHeaders(rawHeaders);

            let data: any = null;
            const contentType = normalizedHeaders['content-type'] || '';
            try {
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = text;
                    }
                }
            } catch {}

            return {
                status: response.status,
                statusText: response.statusText || '',
                headers: normalizedHeaders,
                data,
            };
        } finally {
            clearTimeout(timer);
        }
    }

    public async sendHttpRequestAndReturnJson<T>(
        method: HttpMethod,
        path: RelativePath,
        params?: Record<string, any>,
        headers?: HttpHeaders
    ): Promise<HttpResponse<T>> {
        const mergedHeaders = {
            ...this.buildDefaultHeaders(),
            ...(headers ?? {}),
        };

        return this.sendWithRetry<T>(
            method,
            path,
            params,
            this.toLowercaseHeaders(mergedHeaders)
        );
    }

    private async sendWithRetry<T>(
        method: HttpMethod,
        path: RelativePath,
        params?: Record<string, any>,
        headers?: HttpHeaders
    ): Promise<HttpResponse<T>> {
        const base = (this.config.baseURL || '').replace(/\/+$/, '');

        const url = this.buildUrl(base, path, params); 

        const timeoutMs = this.config.timeoutMs ?? 10_000;

        const maxRetries = this.config.maxRetries ?? 1;

        const normalizedHeaders = this.toLowercaseHeaders(headers ?? {});

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const {
                    status,
                    headers: respHeaders,
                    data,
                    statusText,
                } = await this.attemptOnce(
                    url,
                    method,
                    normalizedHeaders,
                    timeoutMs
                );

                if (
                    status >= HttpStatus.OK &&
                    status < HttpStatus.MULTIPLE_CHOICES
                ) {
                    return { status, headers: respHeaders, data: data as T };
                }

                const message = HTTPService.pickErrorMessage(data, statusText);

                if (this.shouldRetry(status) && attempt < maxRetries) {
                    const delay = this.computeBackoffMs(
                        status,
                        respHeaders,
                        attempt
                    );
                    await this.sleep(delay);
                    continue;
                }

                const retryAfterMs =
                    this.parseRetryDelayMs(respHeaders) ?? undefined;
                    
                this.classifyAndThrow(status, message, retryAfterMs);
            } catch (err: any) {
                const isAbort = err?.name === 'AbortError';

                const isNetworkLike =
                    isAbort ||
                    err?.name === 'TypeError' ||
                    /network/i.test(String(err?.message || ''));

                if (isNetworkLike && attempt < maxRetries) {
                    const delay = this.computeBackoffMs(0, {}, attempt);
                    await this.sleep(delay);
                    continue;
                }

                throw new ServerError(
                    0,
                    isAbort
                        ? 'Request timeout'
                        : err?.message || 'Network error'
                );
            }
        }

        throw new ServerError(0, 'Unexpected retry loop exit');
    }
}
