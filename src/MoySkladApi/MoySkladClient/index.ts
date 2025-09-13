import { RetryService } from '../MoySkladServices/RetryService';
import { HttpService } from '../MoySkladServices/HTTPService';
import { getObjectInLowercase } from '../../utils/objects';
import { buildDefaultHeaders } from '../../utils/headers';
import { classifyAndThrow } from '../../utils/errors';
import { isShouldRetry } from '../../utils/retry';
import { ServerError } from '../MoySkladErrors';
import { buildUrl } from '../../utils/urls';
import {
    DEFAULT_TIMEOUT_MS,
    STATUS_NETWORK_LIKE,
    ERROR_NAME_ABORT,
    ERROR_NAME_TYPE,
    RE_NETWORK_MESSAGE,
    DEFAULT_MAX_RETRIES,
    sleep,
} from '../../utils/constants';
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

    public async attemptOnce<T>(
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
            } = await HttpService.requestWithJson<T>({
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
            ...buildDefaultHeaders(this.config),
            ...(headers ?? {}),
        };

        return this.sendWithRetry<T>(
            method,
            path,
            params,
            getObjectInLowercase(mergedHeaders)
        );
    }

    public async sendWithRetry<T>(
        method: THttpMethod,
        path: TRelativePath,
        params?: Record<string, any>,
        headers?: THttpHeaders
    ): Promise<IHttpResponse<T>> {
        const url = buildUrl(this.config.baseURL || '', path, params);

        const timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

        const maxRetries = this.config.maxRetries ?? DEFAULT_MAX_RETRIES;

        const normalizedHeaders = getObjectInLowercase(headers ?? {});

        const canRetry = (attempt: number) => attempt < maxRetries;

        for (let attempt = 0; ; attempt++) {
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

                const message = HttpService.pickErrorMessage(
                    data,
                    statusText ?? ''
                );

                if (!canRetry(attempt) || !isShouldRetry(status)) {
                    const retryAfterMs =
                        RetryService.parseRetryDelayMs(respHeaders) ??
                        undefined;

                    classifyAndThrow(status, message, retryAfterMs);
                }

                await sleep(
                    RetryService.computeBackoffMs(status, respHeaders, attempt)
                );

                continue;
            } catch (error: any) {
                const isAbort = error?.name === ERROR_NAME_ABORT;

                const isNetworkLike =
                    isAbort ||
                    error?.name === ERROR_NAME_TYPE ||
                    RE_NETWORK_MESSAGE.test(String(error?.message || ''));

                if (!canRetry(attempt) || !isNetworkLike) {
                    throw new ServerError(
                        STATUS_NETWORK_LIKE,
                        isAbort
                            ? 'Request timeout'
                            : error?.message || 'Network error'
                    );
                }

                await sleep(
                    RetryService.computeBackoffMs(
                        STATUS_NETWORK_LIKE,
                        {},
                        attempt
                    )
                );

                continue;
            }
        }
    }
}
