import { safeGetHostname } from '../../../utils/urls';
import {
    resolveProxyUrl,
    pickAbsoluteImageUrl,
} from '../../../utils/moySkladProductData';
import {
    BARCODE_KEYS,
    DEFAULT_MOYSKLAD_BASE_URL,
    DEFAULT_MOYSKLAD_HOSTNAME,
} from '../../../utils/constants';
import {
    toUniqueStringList,
    toNormalizedNonEmptyString,
} from '../../../utils/strings';
import {
    IMoySkladRowWithImages,
    TMoySkladImageLike,
    IMoySkladMediaServiceOptions,
    IMoySkladRowWithPrices,
} from '../../MoySkladTypes';

export class MoySkladProductDataService {
    private readonly moyskladHostname: string;

    private readonly allowMiniatureProxy: boolean;

    constructor(options: IMoySkladMediaServiceOptions = {}) {
        const base =
            options.moyskladBaseUrl ||
            process.env.MOYSKLAD_BASE_URL ||
            DEFAULT_MOYSKLAD_BASE_URL;

        this.moyskladHostname =
            safeGetHostname(base) ?? DEFAULT_MOYSKLAD_HOSTNAME;

        this.allowMiniatureProxy = options.allowMiniatureProxy ?? true;
    }

    public collectBarcodes(row: any): string[] {
        const collected: string[] = [];

        if (!Array.isArray(row?.barcodes)) {
            return [];
        }

        for (const barcode of row.barcodes) {
            if (!barcode) continue;

            let pushedFromKnownKey = false;

            for (const key of BARCODE_KEYS) {
                const value = barcode[key];
                if (value != null && value !== '') {
                    const normalized = toNormalizedNonEmptyString(value);

                    if (!normalized) return [];

                    collected.push(normalized);

                    pushedFromKnownKey = true;
                }
            }

            if (
                !pushedFromKnownKey &&
                barcode.value != null &&
                barcode.value !== ''
            ) {
                const normalized = toNormalizedNonEmptyString(barcode.value);

                if (!normalized) return [];

                collected.push(normalized);
            }
        }

        for (const key of BARCODE_KEYS) {
            const value = row?.[key];
            if (value != null && value !== '') {
                const normalized = toNormalizedNonEmptyString(value);

                if (!normalized) return [];

                collected.push(normalized);
            }
        }

        return toUniqueStringList(collected);
    }

    public extractSalePriceRub(row: IMoySkladRowWithPrices): number | null {
        const rawValue = row.salePrices?.[0]?.value;

        const numericValue = Number(rawValue);

        if (!Number.isFinite(numericValue) || numericValue <= 0) return null;

        return Math.round(numericValue) / 100;
    }

    public extractImageUrls(row: IMoySkladRowWithImages): string[] {
        const selfRows = row?.images?.rows ?? [];

        const parentRows = row?.product?.images?.rows ?? [];

        const singleRefs: TMoySkladImageLike[] = [
            row?.image,
            row?.product?.image,
        ].filter(Boolean) as TMoySkladImageLike[];

        const candidates: TMoySkladImageLike[] = [
            ...selfRows,
            ...parentRows,
            ...singleRefs,
        ];

        const proxiedUrls: string[] = [];
        
        for (const candidate of candidates) {
            const absoluteUrl = pickAbsoluteImageUrl(candidate);

            if (!absoluteUrl) continue;

            const proxyUrl = resolveProxyUrl(
                absoluteUrl,
                this.moyskladHostname
            );
            if (!proxyUrl) continue;

            if (!this.allowMiniatureProxy && proxyUrl.startsWith('/external?'))
                continue;

            proxiedUrls.push(proxyUrl);
        }

        if (this.allowMiniatureProxy) {
            const hasNonMiniature = proxiedUrls.some(
                (url) => !url.startsWith('/external?')
            );

            const preferred = hasNonMiniature
                ? proxiedUrls.filter((url) => !url.startsWith('/external?'))
                : proxiedUrls;

            return toUniqueStringList(preferred);
        }

        return toUniqueStringList(proxiedUrls);
    }
}
