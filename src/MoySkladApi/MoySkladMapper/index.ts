import { toNumberOrNull } from '../../utils/numbers';
import { BARCODE_KEYS } from '../../utils/constants';
import { MarketProduct } from '../MoySkladTypes';

export class MoySkladMapper {
    private static pickBarcodes(row: any): string[] {
        const out: string[] = [];

        if (Array.isArray(row?.barcodes)) {
            for (const barcode of row.barcodes) {
                if (!barcode) continue;

                for (const key of BARCODE_KEYS) {
                    const value = barcode[key];
                    if (value) out.push(String(value));
                }

                if (
                    !BARCODE_KEYS.some((key) => barcode[key]) &&
                    barcode.value
                ) {
                    out.push(String(barcode.value));
                }
            }
        }

        for (const key of BARCODE_KEYS) {
            const value = row?.[key];
            if (value) out.push(String(value));
        }

        return Array.from(
            new Set(
                out
                    .map((value) => String(value).trim())
                    .filter((value) => value.length > 0)
            )
        );
    }

    private static extractPrice(row: any): number | null {
        const raw = row?.salePrices?.[0]?.value;

        const value = Number(raw);

        if (!Number.isFinite(value) || value <= 0) return null;

        return Math.round(value) / 100;
    }

    private static extractImages(row: any): string[] {
        const urls: string[] = [];

        const imageRowsSelf = row?.images?.rows ?? [];

        const imageRowsParent = row?.product?.images?.rows ?? [];

        const singles = [row?.image, row?.product?.image].filter(Boolean);

        const candidates: any[] = [
            ...imageRowsSelf,
            ...imageRowsParent,
            ...singles,
        ];

        const pickUrl = (image: any): string | null => {
            const miniature = image?.miniature?.href;

            const tiny = image?.tiny?.href;

            const small = image?.small?.href;

            const medium = image?.medium?.href;

            const big = image?.big?.href;

            const download = image?.meta?.downloadHref;

            const href = image?.meta?.href;

            const url =
                miniature ??
                tiny ??
                small ??
                medium ??
                big ??
                download ??
                href ??
                null;

            if (!url) return null;

            const normalizedUrl = String(url).trim();
            return normalizedUrl.length > 0 ? normalizedUrl : null;
        };

        for (const image of candidates) {
            const url = pickUrl(image);
            if (url) urls.push(url);
        }

        const deduped = Array.from(new Set(urls));

        return deduped;
    }

    public static toMarketProduct(row: any): MarketProduct {
        const id = String(row?.id ?? '');
        const name = String(row?.name ?? '');

        const code =
            row?.code != null && row.code !== '' ? String(row.code) : undefined;

        const article =
            row?.article != null && row.article !== ''
                ? String(row.article)
                : undefined;

        const barcodes = MoySkladMapper.pickBarcodes(row);
        const price = MoySkladMapper.extractPrice(row);
        const stock = toNumberOrNull(row?.stock);
        const reserve = toNumberOrNull(row?.reserve);

        const imageUrls = MoySkladMapper.extractImages(row);

        const archived = Boolean(row?.archived);

        const weight = toNumberOrNull(row?.weight ?? row?.product?.weight);

        return {
            id,
            name,
            code,
            article,
            barcodes,
            price,
            stock,
            reserve,
            imageUrls,
            archived,
        };
    }
}
