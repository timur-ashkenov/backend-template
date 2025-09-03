import MoySkladDecoder from '../../../services/MoySkladDecoder';
import type { IProduct } from '../../../domains/client';
import { MoySkladClient } from '../../MoySkladClient';
import { TypeGuardsService } from '../../MoySkladGuards';
import {
    ListParams,
    HttpHeaders,
    RateInfo,
    asRelativePath,
} from '../../MoySkladTypes';

export class MoySkladService {
    constructor(private readonly client: MoySkladClient) {}

    public async listAssortmentRaw(params: ListParams): Promise<{
        rows: any[];
        nextOffset?: number;
        rate: RateInfo;
    }> {
        const { rows, responseMeta, headers } =
            await this.fetchAssortment(params);

        if (params.includeImages && rows.length) {
            await this.enrichRowsWithImages(rows);
        }

        const nextOffset = this.calculateNextOffset(responseMeta, rows, params);
        const rate = this.extractRate(headers);

        return { rows, nextOffset, rate };
    }

    public async listMarketProducts(params: ListParams): Promise<{
        items: IProduct[];
        nextOffset?: number;
        rate: RateInfo;
    }> {
        const { rows, responseMeta, headers } =
            await this.fetchAssortment(params);

        if (params.includeImages && rows.length) {
            await this.enrichRowsWithImages(rows);
        }

        const items: IProduct[] = MoySkladDecoder.decodeProductsList(rows);

        const nextOffset = this.calculateNextOffset(responseMeta, rows, params);

        const rate = this.extractRate(headers);

        return { items, nextOffset, rate };
    }

    private async fetchAssortment(params: ListParams): Promise<{
        rows: any[];
        responseMeta: any;
        headers: HttpHeaders;
    }> {
        const requestLimit = params.limit ?? 50;

        const limit = Math.min(100, requestLimit);

        const offset = params.offset ?? 0;

        const queryParams: Record<string, any> = { limit, offset };

        if (params.search) queryParams.search = params.search;

        if (params.includeImages) queryParams.expand = 'images,product';

        if (params.onlyActive !== false) queryParams.filter = 'archived=false';

        const response = await this.client.sendHttpRequestAndReturnJson<any>(
            'GET',
            asRelativePath('entity/assortment'),
            queryParams
        );

        return {
            rows: response?.data?.rows ?? [],
            responseMeta: response?.data?.meta,
            headers: response.headers,
        };
    }

    private calculateNextOffset(
        responseMeta: any,
        rows: any[],
        params: ListParams
    ): number | undefined {
        if (TypeGuardsService.isAssortmentMeta(responseMeta)) {
            const { offset, limit, size } = responseMeta;
            if (offset + limit < size) return offset + limit;
        }

        const requestLimit = params.limit ?? 50;
        if (
            !TypeGuardsService.isAssortmentMeta(responseMeta) &&
            rows.length === requestLimit
        ) {
            return (params.offset ?? 0) + requestLimit;
        }

        return undefined;
    }

    private async enrichRowsWithImages(rows: any[]): Promise<void> {
        const extractIdFromHref = (href?: string): string | null => {
            if (!href) return null;
            const match = href.match(
                /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
            );
            return match ? match[0].toLowerCase() : null;
        };

        type Job = {
            row: any;
            targetProductId: string;
            place: 'self' | 'parent';
        };

        const jobs: Job[] = [];

        for (const row of rows) {
            const hasSelfImages =
                Array.isArray(row?.images?.rows) && row.images.rows.length > 0;
            const hasParentImages =
                Array.isArray(row?.product?.images?.rows) &&
                row.product.images.rows.length > 0;

            if (row?.meta?.type === 'product') {
                if (!hasSelfImages) {
                    const productId =
                        row.id || extractIdFromHref(row?.meta?.href);
                    if (productId)
                        jobs.push({
                            row,
                            targetProductId: String(productId),
                            place: 'self',
                        });
                }
            }

            if (row?.meta?.type === 'variant' || row?.product) {
                if (!hasSelfImages && !hasParentImages) {
                    const productId =
                        row?.product?.id ||
                        extractIdFromHref(row?.product?.meta?.href);
                    if (productId)
                        jobs.push({
                            row,
                            targetProductId: String(productId),
                            place: 'parent',
                        });
                }
            }
        }

        for (const job of jobs) {
            try {
                const resp =
                    await this.client.sendHttpRequestAndReturnJson<any>(
                        'GET',
                        asRelativePath(`entity/product/${job.targetProductId}`),
                        { expand: 'images' }
                    );

                const product = resp?.data;
                const imagesRows = product?.images?.rows;

                if (Array.isArray(imagesRows) && imagesRows.length > 0) {
                    if (job.place === 'self') {
                        job.row.images = {
                            rows: imagesRows,
                            meta: product?.images?.meta,
                        };
                    } else {
                        job.row.product = job.row.product ?? {};
                        job.row.product.images = {
                            rows: imagesRows,
                            meta: product?.images?.meta,
                        };
                    }
                }
            } catch {}
        }
    }

    private extractRate(headers: HttpHeaders): {
        limit: number;
        remaining: number;
        retryAfter: number;
    } {
        const parseIntNonNeg = (value?: string): number => {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric >= 0
                ? Math.trunc(numeric)
                : 0;
        };

        const parseMilliseconds = (value?: string): number | null => {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
        };

        const parseSeconds = (value?: string): number | null => {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric >= 0
                ? Math.trunc(numeric)
                : null;
        };

        const parseRetryAfterHeader = (value?: string): number | null => {
            if (!value) return null;
            const numeric = Number(value);
            if (Number.isFinite(numeric) && numeric >= 0)
                return Math.trunc(numeric);
            const retryAtTimestamp = Date.parse(value);
            if (Number.isNaN(retryAtTimestamp)) return null;
            const msUntilRetry = retryAtTimestamp - Date.now();
            return msUntilRetry > 0 ? Math.ceil(msUntilRetry / 1000) : 0;
        };

        const limit = parseIntNonNeg(headers['x-ratelimit-limit']);

        const remaining = parseIntNonNeg(headers['x-ratelimit-remaining']);

        const retryAfter =
            parseMilliseconds(headers['x-lognex-retry-timeinterval']) ??
            parseSeconds(headers['x-lognex-retry-after']) ??
            parseRetryAfterHeader(headers['retry-after']) ??
            0;

        return { limit, remaining, retryAfter };
    }
}
