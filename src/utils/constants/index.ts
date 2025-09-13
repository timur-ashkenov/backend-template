import { CoverType } from '../../domains/client';

export const EMAIL_BASE_STRUCTURE = /^(?=.{1,254}$)[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CODE_BASE_STRUCTURE = /^\d{6}$/;

export const ALG = 'sha256';

export const CODE_LENGTH = 6;

export const OTP_CODE_MIN_DIGIT = 0;

export const OTP_CODE_MAX_DIGIT = 10;

export const OTP_SALT_LENGTH = 16;

export const OTP_TTL_MS = 60 * 60 * 1000;

export const SMTP_MAX_SEND_ATTEMPTS = 2;

export const SMTP_MIN_SEND_ATTEMPTS = 1;

export const SMTP_RETRY_DELAY_MS = 300;

export const BARCODE_KEYS = ['ean13', 'gtin', 'ean8', 'code128'] as const;

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export enum MoySkladProductAttributes {
    IS_AVAILABLE = 'f4fbe8f9-8cdf-11f0-0a80-064700013c5a',
    PAGES_COUNT = 'Pages Count',
    WEIGHT = 'Weight',
    COVER_TYPE = 'Cover Type',
    ANNOTATION = 'Annotation',
    PUBLISHER = 'Publisher',
    PUBLISHER_BRAND = 'Publisher Brand',
    BUY_REASONS = 'Buy Reasons',
    AGE_RATING = 'Age Rating',
    PUBLICATION_YEAR = 'Publication Year',
    DISCOUNT = 'Discount',
}

export const COVER_TYPE_MAP: Record<string, CoverType> = {
    PAPERBACK: CoverType.PAPERBACK,
    HARDCOVER: CoverType.HARDCOVER,
    DIGITAL: CoverType.DIGITAL,
};

export const UNIVERSALLY_UNIQUE_IDENTIFIER_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ALLOWED_MINIATURE_HOSTNAMES = new Set<string>([
    'miniature-prod.moysklad.ru',
]);

export const DEFAULT_LIMIT = 50;
export const DEFAULT_OFFSET = 0;
export const DEFAULT_INCLUDE_IMAGES = true;
export const DEFAULT_MOYSKLAD_BASE_URL = 'https://api.moysklad.ru/api/remap/1.2/';

export const MINIATURE_HOSTNAME = 'miniature-prod.moysklad.ru';
export const MOYSKLAD_HOSTNAME = (() => {
    try {
        return new URL(process.env.MOYSKLAD_BASE_URL || DEFAULT_MOYSKLAD_BASE_URL)
            .hostname.toLowerCase();
    } catch {
        return 'api.moysklad.ru';
    }
})();
export const DEFAULT_MOYSKLAD_HOSTNAME = 'api.moysklad.ru';
export const RE_DOWNLOAD = /\/download\/[0-9a-f-]{36}$/i;
export const RE_ENTITY_IMAGE = /\/entity\/image\/[0-9a-f-]{36}$/i;

export const RE_TRAILING_SLASHES = /\/+$/;

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_RETRIES = 1;
export const STATUS_NETWORK_LIKE = 0;
export const ERROR_NAME_ABORT = 'AbortError';
export const ERROR_NAME_TYPE = 'TypeError';
export const RE_NETWORK_MESSAGE = /network/i;


