import { IMailService } from '../../IMailService';

export class DevMailService implements IMailService {
    async sendVerificationCode(email: string, code: string): Promise<void> {
        const masked = email.replace(/^(.).+(@.+)$/, '$1***$2');
        console.log(`[DEV MAIL] to=${masked} code=${code}`);
    }
}
