import { HttpHeaders, HttpStatus } from '../../MoySkladTypes';

export class RetryService {
    static parseRetryDelayMs(headers: HttpHeaders): number | null {
        const timeinterval = headers['x-lognex-retry-timeinterval'];

        if (timeinterval) {
            const ms = Number(timeinterval);

            if (Number.isFinite(ms) && ms >= 0) {
                return ms;
            }
        }

        const lognexAfter = headers['x-lognex-retry-after'];

        if (lognexAfter) {
            const sec = Number(lognexAfter);

            if (Number.isFinite(sec) && sec >= 0) {
                return sec * 1000;
            }
        }

        const retryAfter = headers['retry-after'];

        if (!retryAfter) {
            return null;
        }

        const num = Number(retryAfter);

        if (Number.isFinite(num) && num >= 0) {
            return num * 1000;
        }

        const when = Date.parse(retryAfter);

        if (Number.isNaN(when)) {
            return null;
        }

        const delta = when - Date.now();
        
        return delta > 0 ? delta : null;
    }

    static computeBackoffMs(
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
}
