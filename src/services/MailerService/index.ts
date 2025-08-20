import { IMailService } from "../IMailService";

export function makeMailService(): IMailService {
    const provider = (process.env.MAIL_PROVIDER || 'dev').toLowerCase();
    if (provider === 'smtp') {
        const { SmtpMailService } = require('../SmptMailService');
        return new SmtpMailService();
    }
    const { DevMailService } = require('../providers/DevMailerService');
    return new DevMailService();
}
