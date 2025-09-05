import { toNumberOrNull } from '../../utils/numbers';
import { BARCODE_KEYS } from '../../utils/constants';
import {
    MarketProduct,
    MoySkladImage,
    MoySkladImageCollection,
    MoySkladImageLink,
    MoySkladImageMeta,
    MoySkladRowWithImages,
    MoySkladImageLike
} from '../MoySkladTypes';

export class MoySkladMapper {
    private static pickBarcodes(row: any): string[] {
        const barcodes: string[] = [];

        if (Array.isArray(row?.barcodes)) {
            for (const barcode of row.barcodes) {
                if (!barcode) continue;

                for (const key of BARCODE_KEYS) {
                    const value = barcode[key];
                    if (value) barcodes.push(String(value));
                }

                if (
                    !BARCODE_KEYS.some((key) => barcode[key]) &&
                    barcode.value
                ) {
                    barcodes.push(String(barcode.value));
                }
            }
        }

        for (const key of BARCODE_KEYS) {
            const value = row?.[key];
            if (value) barcodes.push(String(value));
        }

        return Array.from(
            new Set(
                barcodes
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

    private static extractImages(row: MoySkladRowWithImages): string[] {
        const urls: string[] = [];

        const imageRowsSelf = row?.images?.rows ?? [];
        const imageRowsParent = row?.product?.images?.rows ?? [];
        const singles: MoySkladImageLike[] = [row?.image, row?.product?.image].filter(
            Boolean
        );

        const candidates: MoySkladImageLike[] = [
            ...imageRowsSelf,
            ...imageRowsParent,
            ...singles,
        ];

        const pickUrl = (image: MoySkladImageLike): string | null => {
            if (!image) return null;

            if (typeof image === 'string') {
                const normalizedUrl = image.trim();
                return normalizedUrl.length ? normalizedUrl : null;
            }

            const fromDownload =
                image.miniature?.downloadHref ||
                image.tiny?.downloadHref ||
                image.small?.downloadHref ||
                image.medium?.downloadHref ||
                image.big?.downloadHref ||
                image.meta?.downloadHref;

            if (fromDownload) {
                const normalizedUrl = String(fromDownload).trim();
                if (normalizedUrl) return normalizedUrl;
            }

            const fromHref =
                image.miniature?.href ||
                image.tiny?.href ||
                image.small?.href ||
                image.medium?.href ||
                image.big?.href ||
                image.meta?.href ||
                image.href;

            if (fromHref) {
                const normalizedUrl = String(fromHref).trim();
                if (normalizedUrl) return normalizedUrl;
            }

            return null;
        };

        for (const image of candidates) {
            const url = pickUrl(image);
            if (url) urls.push(url);
        }

        return Array.from(new Set(urls));
    }

    public static getMarketProduct(row: any): MarketProduct {
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
