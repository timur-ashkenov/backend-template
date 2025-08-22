import { UnprocessableEntityError } from '../../errors';
import { EmailRequestDTO, EmailVerifyRequestDTO } from '../../types';
import {EMAIL_BASE_STRUCTURE, CODE_BASE_STRUCTURE} from '../../utils/сonstants';

export class AuthValidatorService {
    static validateEmailRequest(body: EmailRequestDTO): void {
        const email = body.email?.trim();

        if (!email) {
            throw new UnprocessableEntityError('Email is required');
        }
        if (!EMAIL_BASE_STRUCTURE.test(email)) {
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
