import { RetryService } from '../MoySkladServices/RetryService';
import { HTTPService } from '../MoySkladServices/HTTPService';
import { getObjectInLowercase } from '../../utils/objects';
import { sleep } from '../../utils/constants';
import {
    AuthError,
    RateLimitError,
    ServerError,
    HttpError,
} from '../MoySkladErrors';
import {
    IClientConfig,
    THttpHeaders,
    IHttpResponse,
    TRelativePath,
    HttpStatus,
    THttpMethod,
} from '../MoySkladTypes';

export class MoySkladClient {
    private readonly config: IClientConfig;

    constructor(config: IClientConfig) {
        this.config = config;
    }

    private buildUrl(
        baseURL: string,
        path: TRelativePath,
        params?: Record<string, any>
    ): string {
        const querySet = HTTPService.buildQuery(params);

        const url = `${baseURL}/${path}`;

        return querySet ? `${url}?${querySet}` : url;
    }

    private isShouldRetry(status: number): boolean {
        if (status === HttpStatus.TOO_MANY_REQUESTS) return true;

        if (
            status >= HttpStatus.INTERNAL_SERVER_ERROR &&
            status <= HttpStatus.NETWORK_CONNECT_TIMEOUT_ERROR
        ) {
            return true;
        }

        return false;
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

    private buildAuthHeader(): THttpHeaders {
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

    private buildDefaultHeaders(): THttpHeaders {
        return {
            'accept-encoding': 'gzip',
            accept: 'application/json;charset=utf-8',
            ...this.buildAuthHeader(),
        };
    }

    private async attemptOnce<T>(
        url: string,
        method: THttpMethod,
        headers: THttpHeaders,
        timeoutMs: number
    ): Promise<IHttpResponse<T>> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const {
                status,
                statusText,
                headers: respHeaders,
                data,
            } = await HTTPService.requestWithJson<T>({
                url,
                method,
                headers,
                signal: controller.signal,
            });

            return {
                status,
                statusText,
                headers: respHeaders,
                data,
            };
        } finally {
            clearTimeout(timer);
        }
    }

    public async sendHttpRequestAndReturnJson<T>(
        method: THttpMethod,
        path: TRelativePath,
        params?: Record<string, any>,
        headers?: THttpHeaders
    ): Promise<IHttpResponse<T>> {
        const mergedHeaders = {
            ...this.buildDefaultHeaders(),
            ...(headers ?? {}),
        };

        return this.sendWithRetry<T>(
            method,
            path,
            params,
            getObjectInLowercase(mergedHeaders)
        );
    }

    private async sendWithRetry<T>(
        method: THttpMethod,
        path: TRelativePath,
        params?: Record<string, any>,
        headers?: THttpHeaders
    ): Promise<IHttpResponse<T>> {
        const base = (this.config.baseURL || '').replace(/\/+$/, '');

        const url = this.buildUrl(base, path, params);

        const timeoutMs = this.config.timeoutMs ?? 10_000;

        const maxRetries = this.config.maxRetries ?? 1;

        const normalizedHeaders = getObjectInLowercase(headers ?? {});

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const {
                    status,
                    headers: respHeaders,
                    data,
                    statusText,
                } = await this.attemptOnce<T>(
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

                const message = HTTPService.pickErrorMessage(
                    data,
                    statusText ?? ''
                );

                if (this.isShouldRetry(status) && attempt < maxRetries) {
                    const delay = RetryService.computeBackoffMs(
                        status,
                        respHeaders,
                        attempt
                    );
                    await sleep(delay);
                    continue;
                }

                const retryAfterMs =
                    RetryService.parseRetryDelayMs(respHeaders) ?? undefined;

                this.classifyAndThrow(status, message, retryAfterMs);
            } catch (error: any) {
                const isAbort = error?.name === 'AbortError';

                const isNetworkLike =
                    isAbort ||
                    error?.name === 'TypeError' ||
                    /network/i.test(String(error?.message || ''));

                if (isNetworkLike && attempt < maxRetries) {
                    const delay = RetryService.computeBackoffMs(0, {}, attempt);

                    await sleep(delay);

                    continue;
                }

                throw new ServerError(
                    0,
                    isAbort
                        ? 'Request timeout'
                        : error?.message || 'Network error'
                );
            }
        }

        throw new ServerError(0, 'Unexpected retry loop exit');
    }
}
