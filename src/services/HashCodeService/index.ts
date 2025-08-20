import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

export class HashCodeService {
    public static generateNumericCode(len = 6): string {
        let s = '';

        for (let i = 0; i < len; i++) s += String(randomInt(0, 10));

        return s;
    }

    public static async hashCode(plain: string): Promise<string> {
        const saltRounds = 10;

        return bcrypt.hash(plain, saltRounds);
    }

    public static async compareCode(plain: string, hash: string) {
        return bcrypt.compare(plain, hash);
    }
}
