export class MoySkladAuth {
    public static buildAuthorizationHeaders(): Record<string, string> {
        const bearerToken = process.env.MOYSKLAD_TOKEN;

        if (bearerToken) {
            return { Authorization: `Bearer ${bearerToken}` };
        }

        const username = process.env.MS_USER;

        const password = process.env.MS_PASS;

        if (!username || !password) {
            return {};
        }

        const basicCredentialsBase64 = Buffer
            .from(`${username}:${password}`)
            .toString('base64');

        return { Authorization: `Basic ${basicCredentialsBase64}` };
    }
}