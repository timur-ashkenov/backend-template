import { EmailVerificationDatabaseAPI } from '../EmailVerificationDatabaseAPI';
import { HashCodeService } from '../HashCodeService';
import { makeMailService } from '../MailerService';
import { UnauthorizedError } from '../../errors';

export class EmailVerificationService {
    public static async requestCode(email: string) {
        try {
            const now = new Date();

            const normalized = email.trim().toLowerCase();

            const activeDocument =
                await EmailVerificationDatabaseAPI.findActiveByEmail(
                    normalized
                );

            if (
                activeDocument &&
                activeDocument.lastSentAt &&
                now.getTime() - activeDocument.lastSentAt.getTime() < 60_000
            ) {
                await EmailVerificationDatabaseAPI.touchLastSent(
                    String(activeDocument._id),
                    now
                );

                return;
            }

            const code = HashCodeService.generateNumericCode(6);
            const codeHash = await HashCodeService.hashCode(code);
            const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

            if (activeDocument) {
                await EmailVerificationDatabaseAPI.markConsumed(
                    String(activeDocument._id),
                    now
                );
            }

            await EmailVerificationDatabaseAPI.createNew({
                email: normalized,
                codeHash,
                expiresAt,
                lastSentAt: now,
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

    public static async verifyCode(
        email: string,
        code: string
    ): Promise<{ ok: true; userExists: boolean }> {
        try {
            const now = new Date();

            const normalized = email.trim().toLowerCase();

            const activeDocument =
                await EmailVerificationDatabaseAPI.findActiveByEmail(
                    normalized
                );

            if (!activeDocument) {
                throw new UnauthorizedError('invalid_code');
            }

            if (activeDocument.expiresAt.getTime() <= now.getTime()) {
                throw new UnauthorizedError('expired_code');
            }

            const ok = await HashCodeService.compareCode(
                code.trim(),
                activeDocument.codeHash
            );

            if (!ok) {
                throw new UnauthorizedError('invalid_code');
            }

            await EmailVerificationDatabaseAPI.markConsumed(
                String(activeDocument._id),
                now
            );

            return { ok: true, userExists: false };
        } catch (error) {
            console.error('Failed to verify code', error);

            throw error;
        }
    }
}
