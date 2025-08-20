import { UnprocessableEntityError } from '../../errors';
import { EmailRequestDTO, EmailVerifyRequestDTO } from '../../types';

const EMAIL_BASE_STRUCTURE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_BASE_STRUCTURE = /^\d{6}$/;

export class AuthValidatorService {
    static validateEmailRequest(body: EmailRequestDTO): void {
        const email = body.email?.trim();

        if (!email) {
            throw new UnprocessableEntityError('Email is required');
        }
        if (email.length > 254 || !EMAIL_BASE_STRUCTURE.test(email)) {
            throw new UnprocessableEntityError('Email format is invalid');
        }
    }

    static validateEmailVerify(body: EmailVerifyRequestDTO): void {
        this.validateEmailRequest({ email: body.email });

        const code = body.code?.trim();

        if (!code) {
            throw new UnprocessableEntityError('Code is required');
        }

        if (!CODE_BASE_STRUCTURE.test(code)) {
            throw new UnprocessableEntityError('Code must be 6 digits');
        }
    }
}
