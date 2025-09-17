import MoySkladDecoder from '../../../services/MoySkladDecoder';
import { calculateNextOffset } from '../../../utils/assortment';
import { buildAssortmentQuery } from '../../../utils/query';
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
    IFetchAssortmentResult,
    IMarketProductsResult,
} from '../../MoySkladTypes';

export class MoySkladService {
    constructor(private readonly client: MoySkladClient) {}

    public getNextEnrichTask(
        tasks: TEnrichJob[],
        indexRef: { value: number }
    ): TEnrichJob | undefined {
        if (indexRef.value >= tasks.length) return undefined;

        return tasks[indexRef.value++];
    }

    public async fetchAssortment(
        params: IListParams
    ): Promise<IFetchAssortmentResult> {
        const queryParams = buildAssortmentQuery(params);

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
        const imageEnrichTasks: TEnrichJob[] = [];

        if (!imageEnrichTasks.length) return;

        for (const row of rows) {
            const selfHasImages = hasExpandedImages(row);
            const parentHasImages =
                !!row?.product && Array.isArray(row.product?.images?.rows);

            const selfCollectionHref = row?.images?.meta?.href as
                | string
                | undefined;

            if (!selfHasImages && selfCollectionHref) {
                imageEnrichTasks.push({
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
                imageEnrichTasks.push({
                    kind: 'parent-product',
                    row,
                    productId,
                });
            }
        }

        const concurrency = Math.min(8, imageEnrichTasks.length);

        let taskIndex = { value: 0 };

        const worker = async () => {
            for (;;) {
                const task = this.getNextEnrichTask(
                    imageEnrichTasks,
                    taskIndex
                );

                if (!task) return;

                if (task.kind === 'self-collection') {
                    await applySelfCollectionImages(this.client, task);
                    continue;
                }

                await applyParentProductImages(this.client, task);
            }
        };

        await Promise.all(Array.from({ length: concurrency }, worker));
    }

    public async getListAssortmentRaw(
        params: IListParams
    ): Promise<IAssortmentRawResult> {
        try {
            const { rows, responseMeta, headers } =
                await this.fetchAssortment(params);

            if (
                params.includeImages &&
                rows.length &&
                rows.some((rows) => !hasExpandedImages(rows))
            ) {
                await this.enrichRowsWithImages(rows);
            }

            const nextOffset = calculateNextOffset(responseMeta, rows, params);
            const rate = extractRate(headers);

            return { rows, nextOffset, rate };
        } catch (err: any) {
            throw new Error(
                `getListAssortmentRaw failed: ${err?.message ?? String(err)}`
            );
        }
    }

    public async getListMarketProducts(
        params: IListParams
    ): Promise<IMarketProductsResult> {
        try {
            const queryParams = buildAssortmentQuery({
                ...params,
                includeImages: true,
            });

            const response =
                await this.client.sendHttpRequestAndReturnJson<any>(
                    'GET',
                    asRelativePath('entity/assortment'),
                    queryParams
                );

            const rows: any[] = response?.data?.rows ?? [];

            if (rows.length) await this.enrichRowsWithImages(rows);

            const items: IProduct[] = MoySkladDecoder.decodeProductsList(rows);

            let nextOffset: number | undefined;

            const meta = response?.data?.meta;

            const rate = extractRate(response.headers as THttpHeaders);

            if (TypeGuardsService.isAssortmentMeta(meta)) {
                nextOffset =
                    meta.offset + meta.limit < meta.size
                        ? meta.offset + meta.limit
                        : undefined;
                return { items, nextOffset, rate };
            }

            if (
                !TypeGuardsService.isAssortmentMeta(meta) &&
                rows.length === queryParams.limit
            ) {
                nextOffset = (params.offset ?? 0) + queryParams.limit;
            }

            return { items, nextOffset, rate };
        } catch (error: any) {
            throw new Error(
                `getListMarketProducts failed: ${error?.message ?? String(error)}`
            );
        }
    }
}
