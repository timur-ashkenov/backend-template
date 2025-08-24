import {
    ListParams,
    MarketProduct,
    HttpHeaders,
    AssortmentMeta,
    RateInfo
} from '../IntegrationTypes';
import { MoySkladClient } from '../IntegrationClient';
import { MoySkladMapper } from '../IntegrationMapper';
import { MoySkladGuards } from '../IntegrationGuards';

export class MoySkladService {
    constructor(private readonly client: MoySkladClient) {}

    public async listMarketProducts(params: ListParams): Promise<{
        items: MarketProduct[];
        nextOffset?: number;
        rate: RateInfo;
    }> {
        const requestLimit = params.limit ?? 50;

        const limit = params.includeImages && requestLimit > 100 ? 100 : requestLimit;

        const offset = params.offset ?? 0;

        const query: Record<string, any> = { limit, offset };

        if (params.search) query.search = params.search;

        if (params.includeImages) query.expand = 'images';

        if (params.onlyActive !== false) query.filter = 'archived=false';

        const response = await this.client.getJson<any>(
            '/entity/assortment',
            query
        );

        const rows: any[] = response?.data?.rows ?? [];

        const items: MarketProduct[] = rows.map(MoySkladMapper.toMarketProduct);

        let nextOffset: number | undefined;

        const meta = response?.data?.meta;
        if (
            MoySkladGuards.isAssortmentMeta(meta) &&
            meta.offset + meta.limit < meta.size
        ) {
            nextOffset = meta.offset + meta.limit;
        }
        if (!MoySkladGuards.isAssortmentMeta(meta) && items.length === limit) {
            nextOffset = offset + limit;
        }

        const rate = this.extractRate(response.headers);

        return { items, nextOffset, rate };
    }

    private extractRate(headers: HttpHeaders): {
        limit: number;
        remaining: number;
        retryAfter: number;
    } {
        const parseIntNonNeg = (value?: string): number => {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric >= 0 ? Math.trunc(numeric) : 0;
        };

        const limit = parseIntNonNeg(headers['x-ratelimit-limit']);
        const remaining = parseIntNonNeg(headers['x-ratelimit-remaining']);

        const parseMs = (value?: string): number | null => {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric >= 0 ? numeric : null; 
        };
        const parseSec = (value?: string): number | null => {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric >= 0 ? Math.trunc(numeric) : null; 
        };
        const parseStdRetryAfter = (value?: string): number | null => {
            if (!value) return null;
            
            const numeric = Number(value);

            if (Number.isFinite(numeric) && numeric >= 0) return Math.trunc(numeric);

            const retryAtTimestampMs = Date.parse(value); 

            if (Number.isNaN(retryAtTimestampMs)) return null;

            const msUntilRetry = retryAtTimestampMs - Date.now();

            return msUntilRetry > 0 ? Math.ceil(msUntilRetry / 1000) : 0;
        };
        const firstNonNull = <T>(...valuess: Array<T | null | undefined>) =>
            valuess.find((candidate) => candidate != null);

        const retryAfter =
            firstNonNull(
                (() => {
                    const ms = parseMs(headers['x-lognex-retry-timeinterval']);

                    return ms != null ? Math.ceil(ms / 1000) : null; 
                })(),

                parseSec(headers['x-lognex-retry-after']),

                parseStdRetryAfter(headers['retry-after'])
            ) ?? 0;

        return { limit, remaining, retryAfter };
    }
}
