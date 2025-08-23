import SmtpMailService from "../SmptMailService";
import { IMailService } from "../IMailService";
import { DevMailService } from "../providers/DevMailerService";

export function makeMailService(): IMailService {
  const provider = (process.env.MAIL_PROVIDER || "dev").toLowerCase();

  if (provider === "smtp") {
    return new SmtpMailService();
  }

  return new DevMailService();
}
