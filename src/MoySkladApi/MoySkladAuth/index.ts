export class MoySkladAuth {
    public static buildHeaders(): Record<string, string> {
        if (process.env.MOYSKLAD_TOKEN) {
            return { Authorization: `Bearer ${process.env.MOYSKLAD_TOKEN}` };
        }
        if (process.env.MS_USER && process.env.MS_PASS) {
            const basic = Buffer.from(
                `${process.env.MS_USER}:${process.env.MS_PASS}`
            ).toString('base64');
            return { Authorization: `Basic ${basic}` };
        }
        return {};
    }
}
