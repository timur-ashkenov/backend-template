import type { THttpHeaders } from '../../MoySkladApi/MoySkladTypes';

export function extractRate(headers: THttpHeaders): {
    limit: number;
    remaining: number;
    retryAfter: number;
} {
    const parseIntNonNeg = (value?: string): number => {
        const numeric = Number(value);

        return Number.isFinite(numeric) && numeric >= 0
            ? Math.trunc(numeric)
            : 0;
    };

    const parseMilliseconds = (value?: string): number | null => {
        const numeric = Number(value);

        return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
    };

    const parseSeconds = (value?: string): number | null => {
        const numeric = Number(value);

        return Number.isFinite(numeric) && numeric >= 0
            ? Math.trunc(numeric)
            : null;
    };

    const parseRetryAfterHeader = (value?: string): number | null => {
        if (!value) return null;

        const numeric = Number(value);

        if (Number.isFinite(numeric) && numeric >= 0)
            return Math.trunc(numeric);

        const retryAtTimestamp = Date.parse(value);

        if (Number.isNaN(retryAtTimestamp)) return null;

        const msUntilRetry = retryAtTimestamp - Date.now();

        return msUntilRetry > 0 ? Math.ceil(msUntilRetry / 1000) : 0;
    };

    const limit = parseIntNonNeg(headers['x-ratelimit-limit']);

    const remaining = parseIntNonNeg(headers['x-ratelimit-remaining']);

    const retryAfter =
        parseMilliseconds(headers['x-lognex-retry-timeinterval']) ??
        parseSeconds(headers['x-lognex-retry-after']) ??
        parseRetryAfterHeader(headers['retry-after']) ??
        0;

    return { limit, remaining, retryAfter };
}
