import type {
    THttpHeaders,
    IClientConfig,
} from '../../MoySkladApi/MoySkladTypes';
import { AuthError } from '../../MoySkladApi/MoySkladErrors';
import { HttpStatus } from '../../MoySkladApi/MoySkladTypes';

export function buildAuthHeader(config: IClientConfig): THttpHeaders {
    const tokenTrimmed = (config.token ?? '').trim();

    const hasToken = tokenTrimmed.length > 0;

    const user = config.basic?.user;
    const pass = config.basic?.pass;

    const hasBasic = !!user && !!pass;

    if (!hasToken && !hasBasic) {
        throw new AuthError('Missing credentials', HttpStatus.UNAUTHORIZED);
    }
    if (!hasToken) {
        const encoded = Buffer.from(`${user}:${pass}`, 'utf8').toString(
            'base64'
        );

        return { authorization: `Basic ${encoded}` };
    }

    return {
        authorization: tokenTrimmed.toLowerCase().startsWith('bearer ')
            ? tokenTrimmed
            : `Bearer ${tokenTrimmed}`,
    };
}
