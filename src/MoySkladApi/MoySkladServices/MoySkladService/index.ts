import MoySkladDecoder from '../../../services/MoySkladDecoder';
import { calculateNextOffset } from '../../../utils/assortment';
import { TypeGuardsService } from '../../MoySkladGuards';
import { extractUuidFromHref } from '../../../utils/ids';
import type { IProduct } from '../../../domains/client';
import { MoySkladClient } from '../../MoySkladClient';
import { extractRate } from '../../../utils/rate';
import {
    hasExpandedImages,
    applyParentProductImages,
    applySelfCollectionImages,
} from '../../../utils/images';
import {
    IListParams,
    THttpHeaders,
    TRateInfo,
    asRelativePath,
    IAssortmentRawResult,
    TEnrichJob,
} from '../../MoySkladTypes';

export class MoySkladService {
    constructor(private readonly client: MoySkladClient) {}

    public async fetchAssortment(params: IListParams): Promise<{
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
            headers: response.headers as THttpHeaders,
        };
    }

    public async enrichRowsWithImages(rows: any[]): Promise<void> {
        const jobs: TEnrichJob[] = [];

        for (const row of rows) {
            const selfHasImages = hasExpandedImages(row);
            const parentHasImages =
                !!row?.product && Array.isArray(row.product?.images?.rows);

            const selfCollectionHref = row?.images?.meta?.href as
                | string
                | undefined;

            if (!selfHasImages && selfCollectionHref) {
                jobs.push({
                    kind: 'self-collection',
                    row,
                    collectionHref: selfCollectionHref,
                });
                continue;
            }

            const productId =
                row?.product?.id ??
                extractUuidFromHref(
                    row?.product?.meta?.href ?? row?.meta?.href
                );
            const isVariant = row?.meta?.type === 'variant';

            if (
                (isVariant || row?.product) &&
                !selfHasImages &&
                !parentHasImages &&
                productId
            ) {
                jobs.push({ kind: 'parent-product', row, productId });
            }
        }

        if (!jobs.length) return;

        const concurrency = Math.min(8, jobs.length);

        let nextIndex = 0;

        const getNextJob = (): TEnrichJob | undefined =>
            nextIndex < jobs.length ? jobs[nextIndex++] : undefined;

        const worker = async () => {
            for (;;) {
                const job = getNextJob();
                if (!job) return;

                try {
                    if (job.kind === 'self-collection') {
                        await applySelfCollectionImages(this.client, job);
                        continue;
                    }
                    await applyParentProductImages(this.client, job);
                } catch {}
            }
        };

        await Promise.all(Array.from({ length: concurrency }, worker));
    }

    public async listAssortmentRaw(
        params: IListParams
    ): Promise<IAssortmentRawResult> {
        const { rows, responseMeta, headers } =
            await this.fetchAssortment(params);

        if (params.includeImages && rows.length) {
            const needsEnrich = rows.some((row) => !hasExpandedImages(row));

            if (needsEnrich) await this.enrichRowsWithImages(rows);
        }

        const nextOffset = calculateNextOffset(responseMeta, rows, params);
        const rate = extractRate(headers);

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

        if (rows.length) await this.enrichRowsWithImages(rows);

        const items: IProduct[] = MoySkladDecoder.decodeProductsList(rows);

        let nextOffset: number | undefined;

        const meta = response?.data?.meta;

        const rate = extractRate(response.headers as THttpHeaders);

        if (TypeGuardsService.isAssortmentMeta(meta)) {
            if (meta.offset + meta.limit < meta.size) {
                nextOffset = meta.offset + meta.limit;
            }
            return { items, nextOffset, rate };
        }

        if (rows.length === limit) {
            nextOffset = offset + limit;
        }

        return { items, nextOffset, rate };
    }
}
