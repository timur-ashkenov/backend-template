import { THttpHeaders, HttpStatus } from '../../MoySkladTypes';
import { toNonNegativeNumber } from '../../../utils/numbers';
import {
    HDR_LOGNEX_RETRY_AFTER,
    HDR_LOGNEX_TIMEINTERVAL,
    HDR_RETRY_AFTER,
    MS_IN_SECOND,
    RATE_LIMIT_MAX_MS,
    RATE_LIMIT_STEP_MS,
    EXP_BASE_MS,
    EXP_CAP_MS,
    JITTER_MAX_MS,
} from '../../../utils/constants';

export class RetryService {
    public static isShouldRetry(status: number): boolean {
        if (status === HttpStatus.TOO_MANY_REQUESTS) return true;

        return (
            status >= HttpStatus.INTERNAL_SERVER_ERROR &&
            status <= HttpStatus.NETWORK_CONNECT_TIMEOUT_ERROR
        );
    }

    static parseRetryDelayMs(headers: THttpHeaders): number | null {
        const fromIntervalMs = toNonNegativeNumber(
            headers[HDR_LOGNEX_TIMEINTERVAL]
        );

        if (fromIntervalMs != null) return fromIntervalMs;

        const fromLognexAfterSec = toNonNegativeNumber(
            headers[HDR_LOGNEX_RETRY_AFTER]
        );

        if (fromLognexAfterSec != null)
            return fromLognexAfterSec * MS_IN_SECOND;

        const retryAfter = headers[HDR_RETRY_AFTER];

        if (!retryAfter) return null;

        const retryAfterSec = toNonNegativeNumber(retryAfter);

        if (retryAfterSec != null) return retryAfterSec * MS_IN_SECOND;

        const when = Date.parse(String(retryAfter));

        if (Number.isNaN(when)) return null;

        const delta = when - Date.now();

        return delta > 0 ? delta : null;
    }

    static computeBackoffMs(
        status: number,
        headers: THttpHeaders,
        attempt: number
    ): number {
        const isRateLimited =
            status === HttpStatus.TOO_MANY_REQUESTS ||
            status === HttpStatus.SERVICE_UNAVAILABLE;

        if (!isRateLimited) {
            const exponentialBackoffMs = Math.min(
                EXP_BASE_MS * 2 ** attempt,
                EXP_CAP_MS
            );

            const jitter = Math.floor(Math.random() * JITTER_MAX_MS);

            return exponentialBackoffMs + jitter;
        }

        const hinted = this.parseRetryDelayMs(headers);

        if (hinted != null) return hinted;

        return Math.min(RATE_LIMIT_STEP_MS * (attempt + 1), RATE_LIMIT_MAX_MS);
    }
}
