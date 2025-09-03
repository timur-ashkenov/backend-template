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

export const ATTR = {
    IS_AVAILABLE: '8eeaa47a-86b1-11f0-0a80-14bc00992b60',
    PAGES_COUNT: 'Pages Count',
    WEIGHT: 'Weight',
    COVER_TYPE: 'Cover Type',
    ANNOTATION: 'Annotation',
    PUBLISHER: 'Publisher',
    PUBLISHER_BRAND: 'Publisher Brand',
    BUY_REASONS: 'Buy Reasons',
    AGE_RATING: 'Age Rating',
    PUBLICATION_YEAR: 'Publication Year',
    DISCOUNT: 'Discount',
} as const;

export const COVER_TYPE_MAP: Record<
    string,
    'PAPERBACK' | 'HARDCOVER' | 'DIGITAL'
> = {
    PAPERBACK: 'PAPERBACK',
    HARDCOVER: 'HARDCOVER',
    SOFTCOVER: 'PAPERBACK',
    EBOOK: 'DIGITAL',
};
