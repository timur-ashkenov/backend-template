import { toNumberOrNull } from '../../utils/numbers';
import { BARCODE_KEYS } from '../../utils/constants';
import {
    MarketProduct,
    MoySkladRowWithImages,
    MoySkladImageLike,
} from '../MoySkladTypes';

const DEFAULT_MS_BASE = 'https://api.moysklad.ru/api/remap/1.2/';
const MINIATURE_HOST = 'miniature-prod.moysklad.ru';

const MOYSKLAD_HOST = (() => {
    try {
        return new URL(
            process.env.MOYSKLAD_BASE_URL || DEFAULT_MS_BASE
        ).hostname.toLowerCase();
    } catch {
        return 'api.moysklad.ru';
    }
})();

function isMiniatureUrl(url: string): boolean {
    try {
        return new URL(url).hostname === MINIATURE_HOST;
    } catch {
        return false;
    }
}

function toProxyUrl(absoluteUrl: string): string | null {
    let parsed: URL;
    try {
        parsed = new URL(absoluteUrl);
    } catch {
        return null;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (hostname === MINIATURE_HOST) {
        return `/external?url=${encodeURIComponent(absoluteUrl)}`;
    }

    if (hostname === MOYSKLAD_HOST) {
        const isDownload = /\/download\/[0-9a-f-]{36}$/i.test(parsed.pathname);
        const isEntityImage = /\/entity\/image\/[0-9a-f-]{36}$/i.test(
            parsed.pathname
        );
        if (isDownload || isEntityImage) {
            return `/image-by-url?href=${encodeURIComponent(absoluteUrl)}`;
        }
    }

    return null;
}

function unique(values: string[]): string[] {
    const seen = new Set<string>();

    const result: string[] = [];

    for (const value of values) {
        if (seen.has(value)) continue;

        seen.add(value);

        result.push(value);
    }
    return result;
}


export class MoySkladMapper {

    private static pickBarcodes(row: any): string[] {
        const collected: string[] = [];

        if (Array.isArray(row?.barcodes)) {
            for (const barcode of row.barcodes) {
                if (!barcode) continue;

                for (const key of BARCODE_KEYS) {
                    const value = barcode[key];
                    if (value) collected.push(String(value));
                }

                if (!BARCODE_KEYS.some((keys) => barcode[keys]) && barcode.value) {
                    collected.push(String(barcode.value));
                }
            }
        }

        for (const key of BARCODE_KEYS) {
            const value = row?.[key];
            if (value) collected.push(String(value));
        }

        return unique(
            collected.map((value) => String(value).trim()).filter((value) => value.length > 0)
        );
    }

    private static extractPrice(row: any): number | null {
        const raw = row?.salePrices?.[0]?.value;

        const value = Number(raw);

        if (!Number.isFinite(value) || value <= 0) return null;

        return Math.round(value) / 100;
    }


    private static pickAbsoluteUrl(image: MoySkladImageLike): string | null {
        if (!image) return null;

        if (typeof image === 'string') {
            const normalized = image.trim();

            return normalized || null;

        }

        const fromDownload =
            image.big?.downloadHref ||
            image.medium?.downloadHref ||
            image.small?.downloadHref ||
            image.meta?.downloadHref;

        if (fromDownload) return String(fromDownload).trim();

        const fromHref =
            image.big?.href ||
            image.medium?.href ||
            image.small?.href ||
            image.meta?.href ||
            image.href;

        if (fromHref) return String(fromHref).trim();

        const fallbacks =
            image.tiny?.downloadHref ||
            image.miniature?.downloadHref ||
            image.tiny?.href ||
            image.miniature?.href;

        return fallbacks ? String(fallbacks).trim() : null;
    }

    private static extractImages(row: MoySkladRowWithImages): string[] {
        const selfRows = row?.images?.rows ?? [];
        const parentRows = row?.product?.images?.rows ?? [];
        const singleRefs: MoySkladImageLike[] = [
            row?.image,
            row?.product?.image,
        ].filter(Boolean);

        const candidates: MoySkladImageLike[] = [
            ...selfRows,
            ...parentRows,
            ...singleRefs,
        ];

        const proxiedUrls: string[] = [];
        for (const candidate of candidates) {
            const absoluteUrl = this.pickAbsoluteUrl(candidate);

            if (!absoluteUrl) continue;

            const proxyUrl = toProxyUrl(absoluteUrl);

            if (proxyUrl) proxiedUrls.push(proxyUrl);
        }

        const hasNonMiniature = proxiedUrls.some(
            (url) => !url.startsWith('/external?')
        );
        const finalList = hasNonMiniature
            ? proxiedUrls.filter((url) => !url.startsWith('/external?'))
            : proxiedUrls;

        return unique(finalList);
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

        const barcodes = this.pickBarcodes(row);

        const price = this.extractPrice(row);

        const stock = toNumberOrNull(row?.stock);

        const reserve = toNumberOrNull(row?.reserve);

        const imageUrls = this.extractImages(row);

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
