import type { MoySkladClient } from '../../MoySkladApi/MoySkladClient';
import type { TEnrichJob } from '../../MoySkladApi/MoySkladTypes';
import { asRelativePath } from '../../MoySkladApi/MoySkladTypes';

export async function applyParentProductImages(
    client: MoySkladClient,
    job: Extract<TEnrichJob, { kind: 'parent-product' }>
): Promise<void> {
    const response = await client.sendHttpRequestAndReturnJson<any>(
        'GET',
        asRelativePath(`entity/product/${job.productId}`),
        { expand: 'images' }
    );

    const product = response?.data;
    const imagesRows = normalizeImageRows(product?.images?.rows);

    if (!imagesRows.length) return;

    job.row.product = job.row.product ?? {};
    job.row.product.images = {
        rows: imagesRows,
        meta: product?.images?.meta,
    };
}

export async function applySelfCollectionImages(
    client: MoySkladClient,
    job: Extract<TEnrichJob, { kind: 'self-collection' }>
): Promise<void> {
    const response = await client.sendHttpRequestAndReturnJson<any>(
        'GET',
        asRelativePath(job.collectionHref)
    );

    const imagesRows = normalizeImageRows(response?.data?.rows);
    if (!imagesRows.length) return;

    job.row.images = {
        ...(job.row.images ?? {}),
        rows: imagesRows,
        meta: job.row.images?.meta,
    };
}

export function hasExpandedImages(row: any): boolean {
    return !!row?.images && Array.isArray(row.images.rows);
}

export function normalizeImageRows(maybeRows: unknown): any[] {
    return Array.isArray(maybeRows) ? maybeRows : [];
}
