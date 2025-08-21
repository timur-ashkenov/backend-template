let _otpSecretBuf: Buffer | null = null;

export function requireOtpSecretBuf(): Buffer {
  if (_otpSecretBuf) return _otpSecretBuf;
  const s = process.env.OTP_SECRET ?? '';
  if (s.length < 32) {
    const hint = s ? `length=${s.length}` : 'not set';
    throw new Error(`OTP_SECRET is invalid: ${hint} (>=32 chars required)`);
  }
  _otpSecretBuf = Buffer.from(s, 'utf8');
  return _otpSecretBuf;
}