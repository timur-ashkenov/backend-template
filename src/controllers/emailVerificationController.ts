import { AuthValidatorService } from '../ValidationServices/AuthValidatorService';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { Request, Response } from 'express';

export class EmailVerificationController {
    static async requestCode(request: Request, response: Response) {
        AuthValidatorService.validateEmailRequest(request.body);

        const email = String(request.body.email);

        await EmailVerificationService.requestCode(email);

        return response.status(200).json({ ok: true });
    }

    static async verifyCode(request: Request, response: Response) {
        AuthValidatorService.validateEmailVerify(request.body);

        const email = String(request.body.email);
        const code = String(request.body.code);

        const result = await EmailVerificationService.verifyCode(email, code);

        return response.status(200).json({ ok: true });
    }
}
