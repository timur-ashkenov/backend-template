import { AuthValidatorService } from '../ValidationServices/AuthValidatorService';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { Request, Response } from 'express';
import { UnauthorizedError } from '../errors';

export class EmailVerificationController {
    static async requestCode(request: Request, response: Response) {
        AuthValidatorService.validateEmailRequest(request.body);

        const email = String(request.body.email);

        await EmailVerificationService.requestCode(email);

        return response.status(200).json({ ok: true });
    }

    static async verifyCode(request: Request, response: Response) {
        try {
            AuthValidatorService.validateEmailVerify(request.body);

            const email = String(request.body.email);
            const code = String(request.body.code);

            await EmailVerificationService.verifyCode(email, code);

            return response.status(200).json({ ok: true });
        } catch (error) {
            console.error('verifyCode failed', error);

            if (error instanceof UnauthorizedError) {
                return response
                    .status(401)
                    .json({ ok: false, message: error.message });
            }

            return response
                .status(500)
                .json({ ok: false, message: 'Internal server error' });
        }
    }
}
