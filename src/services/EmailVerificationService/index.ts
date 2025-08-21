import { EmailVerificationDatabaseAPI } from '../EmailVerificationDatabaseAPI';
import { HashCodeService } from '../HashCodeService';
import { OTP_TTL_MS } from '../../utils/Constants';
import { makeMailService } from '../MailerService';
import { UnauthorizedError } from '../../errors';

export class EmailVerificationService {
    public static async requestCode(email: string) {
        try {
            const now = new Date();

            const normalized = email.trim().toLowerCase();

            const activeVerification =
                await EmailVerificationDatabaseAPI.findActiveByEmail(
                    normalized
                );

            if (activeVerification) {
                return;
            }

            const code = HashCodeService.generateNumericCode();
            const codeHash = HashCodeService.hashCode(code);
            const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

            await EmailVerificationDatabaseAPI.createNew({
                email: normalized,
                codeHash,
                expiresAt,
            });

            const mailer = makeMailService();

            try {
                await mailer.sendVerificationCode(normalized, code);
            } catch (error) {
                console.error('[MAIL] sendVerificationCode failed', error);
            }
        } catch (error) {
            console.error('Failed to request code', error);

            throw error;
        }
    }

    public static async verifyCode(email: string, code: string): Promise<void> {
        const now = new Date();
        const normalized = email.trim().toLowerCase();

        const activeVerification =
            await EmailVerificationDatabaseAPI.findActiveByEmail(normalized);
        if (!activeVerification) {
            throw new UnauthorizedError('invalid_code');
        }

        if (activeVerification.expiresAt.getTime() <= now.getTime()) {
            throw new UnauthorizedError('expired_code');
        }

        const ok = HashCodeService.compareCode(code.trim(), activeVerification.codeHash);
        if (!ok) {
            throw new UnauthorizedError('invalid_code');
        }

        await EmailVerificationDatabaseAPI.markConsumed(
            String(activeVerification._id),
            now
        );
    }
}
