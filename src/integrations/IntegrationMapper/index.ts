import { toNumberOrNull } from '../../utils/numbers';
import { BARCODE_KEYS } from '../../utils/constants';
import { MarketProduct } from '../IntegrationTypes';

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
        const out: string[] = [];

        const imageRows = row?.images?.rows;

        if (Array.isArray(imageRows)) {
            for (const imageRow of imageRows) {
                const imageUrl =
                    imageRow?.meta?.downloadHref || imageRow?.meta?.href;

                if (imageUrl) out.push(String(imageUrl));
            }
        }
        const singleUrl =
            row?.image?.meta?.downloadHref || row?.image?.meta?.href;

        if (singleUrl) out.push(String(singleUrl));

        return Array.from(
            new Set(
                out
                    .map((value) => String(value).trim())
                    .filter((value) => value.length > 0)
            )
        );
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
