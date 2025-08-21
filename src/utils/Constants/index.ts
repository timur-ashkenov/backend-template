export const EMAIL_BASE_STRUCTURE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CODE_BASE_STRUCTURE = /^\d{6}$/;
export const ALG = "sha256";

export const CODE_LENGTH = 6;

export const OTP_CODE_MIN_DIGIT = 0;

export const OTP_CODE_MAX_DIGIT = 10;

export const OTP_SALT_LENGTH = 16;

export const OTP_TTL_MS = 60 * 60 * 1000;

export const SMTP_MAX_SEND_ATTEMPTS = 2;

export const SMTP_MIN_SEND_ATTEMPTS = 1;

export const SMTP_RETRY_DELAY_MS = 300;