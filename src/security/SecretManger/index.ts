let _otpSecretBuf: Buffer | null = null;

export function requireOtpSecretBuf(): Buffer {
  if (_otpSecretBuf) return _otpSecretBuf;

  const rawSecret = process.env.OTP_SECRET ?? '';

  if (rawSecret.length < 32) {
    const hint = rawSecret ? `length=${rawSecret.length}` : 'not set';

    throw new Error(`OTP_SECRET is invalid: ${hint} (>=32 chars required)`);
  }
  _otpSecretBuf = Buffer.from(rawSecret, 'utf8');

  return _otpSecretBuf;
}