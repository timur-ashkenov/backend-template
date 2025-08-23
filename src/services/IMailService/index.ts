export interface IMailService {
    sendVerificationCode(email: string, code: string): Promise<void>;
}