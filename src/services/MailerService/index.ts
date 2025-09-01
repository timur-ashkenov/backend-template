import SmtpMailService from "../SmptMailService";
import { IMailService } from "../IMailService";

export function makeMailService(): IMailService {
  return new SmtpMailService();
}
