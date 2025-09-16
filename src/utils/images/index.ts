import type { MoySkladClient } from '../../MoySkladApi/MoySkladClient';
import type { TEnrichJob } from '../../MoySkladApi/MoySkladTypes';
import { asRelativePath } from '../../MoySkladApi/MoySkladTypes';

export async function applyParentProductImages(
    client: MoySkladClient,
    enrichTask: Extract<TEnrichJob, { kind: 'parent-product' }>
): Promise<void> {
    const response = await client.sendHttpRequestAndReturnJson<any>(
        'GET',
        asRelativePath(`entity/product/${enrichTask.productId}`),
        { expand: 'images' }
    );

    const product = response?.data;
    const imagesRows = normalizeImageRows(product?.images?.rows);

    if (!imagesRows.length) return;

    enrichTask.row.product = enrichTask.row.product ?? {};
    enrichTask.row.product.images = {
        rows: imagesRows,
        meta: product?.images?.meta,
    };
}

export async function applySelfCollectionImages(
    client: MoySkladClient,
    enrichTask: Extract<TEnrichJob, { kind: 'self-collection' }>
): Promise<void> {
    const response = await client.sendHttpRequestAndReturnJson<any>(
        'GET',
        asRelativePath(enrichTask.collectionHref)
    );

    const imagesRows = normalizeImageRows(response?.data?.rows);

    if (!imagesRows.length) return;

    enrichTask.row.images = {
        ...(enrichTask.row.images ?? {}),
        rows: imagesRows,
        meta: enrichTask.row.images?.meta,
    };
}

export function hasExpandedImages(row: any): boolean {
    return !!row?.images && Array.isArray(row.images.rows);
}

export function normalizeImageRows(maybeRows: unknown): any[] {
    return Array.isArray(maybeRows) ? maybeRows : [];
}
