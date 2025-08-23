import nodemailer from 'nodemailer';
import { IMailService } from '../IMailService';
import { Delays } from '../../utils/methods';
import {
    SMTP_MIN_SEND_ATTEMPTS,
    SMTP_MAX_SEND_ATTEMPTS,
    SMTP_RETRY_DELAY_MS,
} from '../../utils/constants';

class SmtpMailService implements IMailService {
    private static isPermanentError(err: any): boolean {
        const code = err?.code;

        const status = err?.responseCode;

        return (
            (typeof status === 'number' && status >= 400 && status < 500) ||
            code === 'EAUTH' ||
            code === 'EENVELOPE'
        );
    }

    private transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    });

    private from = process.env.MAIL_FROM || 'no-reply@example.com';

    async sendVerificationCode(email: string, code: string): Promise<void> {
        const subject = `Yours code to entrance: ${code}`;
        const text = `Your verification code: ${code}
It is valid for 1 hour. If you did not request the code, simply ignore this email.`;

        let lastError: unknown;

        for (
            let attempt = SMTP_MIN_SEND_ATTEMPTS;
            attempt <= SMTP_MAX_SEND_ATTEMPTS;
            attempt++
        ) {
            try {
                console.log('[SMTP] before sendMail', { to: email });
                const info = await this.transporter.sendMail({
                    from: this.from,
                    to: email,
                    subject,
                    text,
                });
                console.log('[SMTP] sent OK', {
                    messageId: info.messageId,
                    response: info.response,
                });
                return;
            } catch (error) {
                lastError = error;

                if (SmtpMailService.isPermanentError(error)) {
                    console.error("[SMTP] permanent error, won't retry", {
                        error,
                    });
                    throw error;
                }

                if (attempt < SMTP_MAX_SEND_ATTEMPTS) {
                    console.warn(
                        '[SMTP] transient error, will retry after delay',
                        { attempt, error }
                    );
                    await Delays.smtp(SMTP_RETRY_DELAY_MS);
                }
            }
        }
    }
}

export default SmtpMailService;
