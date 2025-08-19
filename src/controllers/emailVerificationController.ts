import { Request, Response } from 'express';

export class EmailVerificationController {
    static async requestCode (request: Request, response: Response) {
        return response.status(200);
    }

    static async verifyCode (request: Request, response: Response) {
        return response.status(200);
    }
}