import MoySkladDecoder from '../../../services/MoySkladDecoder';
import type { IProduct } from '../../../domains/client';
import { MoySkladClient } from '../../MoySkladClient';
import { TypeGuardsService } from '../../MoySkladGuards';
import {
    IListParams,
    THttpHeaders,
    TRateInfo,
    asRelativePath,
    IAssortmentRawResult,
    TEnrichJob
} from '../../MoySkladTypes';

export class MoySkladService {
    constructor(private readonly client: MoySkladClient) {}

    private hasExpandedImages(row: any): boolean {
        return !!row?.images && Array.isArray(row.images.rows);
    }

    private extractUuidFromHref(href?: string): string | null {
        if (!href) return null;
        const match = href.match(/[0-9a-fA-F-]{36}/);
        return match ? match[0].toLowerCase() : null;
    }

    private calculateNextOffset(
        responseMeta: any,
        rows: any[],
        params: IListParams
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

    private extractRate(headers: THttpHeaders): {
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

    public async listAssortmentRaw(params: IListParams): Promise<IAssortmentRawResult> {
        const { rows, responseMeta, headers } =
            await this.fetchAssortment(params);

        if (params.includeImages && rows.length) {
            const needEnrich = rows.some((r) => !this.hasExpandedImages(r));
            if (needEnrich) await this.enrichRowsWithImages(rows);
        }

        const nextOffset = this.calculateNextOffset(responseMeta, rows, params);
        const rate = this.extractRate(headers);
        return { rows, nextOffset, rate };
    }

    public async listMarketProducts(params: IListParams): Promise<{
        items: IProduct[];
        nextOffset?: number;
        rate: TRateInfo;
    }> {
        const requestLimit = params.limit ?? 50;
        const limit = Math.min(100, requestLimit);
        const offset = params.offset ?? 0;

        const query: Record<string, any> = { limit, offset };
        if (params.search) query.search = params.search;

        query.expand = 'images,product';

        if (params.onlyActive !== false) query.filter = 'archived=false';

        const response = await this.client.sendHttpRequestAndReturnJson<any>(
            'GET',
            asRelativePath('entity/assortment'),
            query
        );

        const rows: any[] = response?.data?.rows ?? [];

        console.log('[ASSORTMENT_QUERY]', query);
        if (rows[0]) {
            console.log('[ASSORTMENT_FIRST_ROW_BEFORE_ENRICH]', {
                id: rows[0]?.id,
                type: rows[0]?.meta?.type,
                selfSize: rows[0]?.images?.meta?.size,
                parentSize: rows[0]?.product?.images?.meta?.size,
            });
        }

        await this.enrichRowsWithImages(rows); 

        if (rows[0]) {
            console.log('[ASSORTMENT_FIRST_ROW_AFTER_ENRICH]', {
                id: rows[0]?.id,
                selfSize: rows[0]?.images?.meta?.size,
                parentSize: rows[0]?.product?.images?.meta?.size,
            });
        }

        const items: IProduct[] = MoySkladDecoder.decodeProductsList(rows);

        let nextOffset: number | undefined;

        const meta = response?.data?.meta;

        if (TypeGuardsService.isAssortmentMeta(meta)) {
            if (meta.offset + meta.limit < meta.size)
                nextOffset = meta.offset + meta.limit;
        }
        if (
            !TypeGuardsService.isAssortmentMeta(meta) &&
            rows.length === limit
        ) {
            nextOffset = offset + limit;
        }

        const rate = this.extractRate(response.headers);
        return { items, nextOffset, rate };
    }


    private async fetchAssortment(params: IListParams): Promise<{
        rows: any[];
        responseMeta: any;
        headers: THttpHeaders;
    }> {
        const requestLimit = params.limit ?? 50;

        const effectiveLimit = params.includeImages
            ? Math.min(100, requestLimit)
            : requestLimit;

        const offset = params.offset ?? 0;
        const queryParams: Record<string, any> = {
            limit: effectiveLimit,
            offset,
        };

        if (params.search) queryParams.search = params.search;

        queryParams.expand = params.includeImages
            ? 'images,product'
            : 'product';

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

    private async enrichRowsWithImages(rows: any[]): Promise<void> {
        const jobs: TEnrichJob[] = [];

        for (const row of rows) {
            const hasSelf = this.hasExpandedImages(row);

            const hasParent =
                !!row?.product &&
                !!row.product.images &&
                Array.isArray(row.product.images.rows);

            const selfCollectionHref = row?.images?.meta?.href as
                | string
                | undefined;

            if (!hasSelf && selfCollectionHref) {
                jobs.push({
                    kind: 'self-collection',
                    row,
                    collectionHref: selfCollectionHref,
                });
                continue;
            }

            const productId =
                row?.product?.id ??
                this.extractUuidFromHref(
                    row?.product?.meta?.href ?? row?.meta?.href
                );

            if (
                (row?.meta?.type === 'variant' || row?.product) &&
                !hasSelf &&
                !hasParent &&
                productId
            ) {
                jobs.push({ kind: 'parent-product', row, productId });
            }
        }

        if (!jobs.length) return;

        const concurrency = Math.min(8, jobs.length);
        let i = 0;

        const worker = async () => {
            while (i < jobs.length) {
                const j = jobs[i++];
                try {
                    if (j.kind === 'self-collection') {
                        const resp =
                            await this.client.sendHttpRequestAndReturnJson<any>(
                                'GET',
                                asRelativePath(j.collectionHref)
                            );
                        const imagesRows = Array.isArray(resp?.data?.rows)
                            ? resp.data.rows
                            : [];
                        if (imagesRows.length) {
                            j.row.images = {
                                ...(j.row.images ?? {}),
                                rows: imagesRows,
                                meta: j.row.images?.meta,
                            };
                        }
                    } else {
                        const resp =
                            await this.client.sendHttpRequestAndReturnJson<any>(
                                'GET',
                                asRelativePath(`entity/product/${j.productId}`),
                                { expand: 'images' }
                            );
                        const product = resp?.data;
                        const imagesRows = Array.isArray(product?.images?.rows)
                            ? product.images.rows
                            : [];
                        if (imagesRows.length) {
                            j.row.product = j.row.product ?? {};
                            j.row.product.images = {
                                rows: imagesRows,
                                meta: product?.images?.meta,
                            };
                        }
                    }
                } catch {
                }
            }
        };

        await Promise.all(Array.from({ length: concurrency }, worker));
    }
}
