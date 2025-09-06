import { UnprocessableEntityError } from '../../errors';
import { EmailRequestDTO, EmailVerifyRequestDTO } from '../../types/EmailRequestDTOTypes';
import {EMAIL_BASE_STRUCTURE, CODE_BASE_STRUCTURE} from '../../utils/constants';

export class AuthValidatorService {
    static validateEmailRequest(body: EmailRequestDTO): void {

        if (!body.email) {
            throw new UnprocessableEntityError('Email is required');
        }
        if (!EMAIL_BASE_STRUCTURE.test(body.email)) {
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
