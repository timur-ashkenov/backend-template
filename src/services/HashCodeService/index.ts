import { ALG, CODE_LENGTH, OTP_CODE_MIN_DIGIT, OTP_CODE_MAX_DIGIT, OTP_SALT_LENGTH } from "../../utils/constants";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { requireOtpSecretBuf } from "../../security/SecretManger";

export class HashCodeService {
  public static myRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  public static generateNumericCode(len = CODE_LENGTH): string {
    let code = "";

    for (let i = 0; i < len; i++) {
      code += String(this.myRandomInt(OTP_CODE_MIN_DIGIT, OTP_CODE_MAX_DIGIT));
    }

    return code;
  }
  
  public static hashCode(plain: string): string {
    const salt = randomBytes(OTP_SALT_LENGTH);

    const macHex = createHmac(ALG, requireOtpSecretBuf())
      .update(salt).update("|").update(plain).update("|v1")
      .digest("hex");

    return `${salt.toString("base64")}:${macHex}`;
  }

  public static compareCode(plain: string, stored: string): boolean {
    const [saltB64, macHex] = stored.split(":");

    if (!saltB64 || !macHex) return false;

    const salt = Buffer.from(saltB64, "base64");

    const expected = Buffer.from(macHex, "hex");

    const computed = createHmac(ALG, requireOtpSecretBuf())
      .update(salt).update("|").update(plain).update("|v1")
      .digest();

    return expected.length === computed.length && timingSafeEqual(expected, computed);
  }
}
