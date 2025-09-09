import {
    BARCODE_KEYS,
    DEFAULT_MOYSKLAD_BASE_URL,
    MINIATURE_HOSTNAME,
} from '../../../utils/constants';
import { MoySkladRowWithImages, MoySkladImageLike } from '../../MoySkladTypes';

export interface MoySkladMediaServiceOptions {
    moyskladBaseUrl?: string;
    allowMiniatureProxy?: boolean;
}

export class MoySkladMediaService {
    private readonly moyskladHostname: string;

    private readonly allowMiniatureProxy: boolean;

    constructor(options: MoySkladMediaServiceOptions = {}) {
        const base =
            options.moyskladBaseUrl ||
            process.env.MOYSKLAD_BASE_URL ||
            DEFAULT_MOYSKLAD_BASE_URL;

        this.moyskladHostname = this.safeGetHostname(base) ?? 'api.moysklad.ru';

        this.allowMiniatureProxy = options.allowMiniatureProxy ?? true;
    }

    public collectBarcodes(row: any): string[] {
        const collected: string[] = [];

        if (Array.isArray(row?.barcodes)) {
            for (const barcode of row.barcodes) {
                if (!barcode) continue;

                let pushedFromKnownKey = false;
                for (const key of BARCODE_KEYS) {
                    const value = barcode[key];
                    if (value != null && value !== '') {
                        const normalized =
                            this.toNormalizedNonEmptyString(value);
                        if (normalized) collected.push(normalized);
                        pushedFromKnownKey = true;
                    }
                }

                if (
                    !pushedFromKnownKey &&
                    barcode.value != null &&
                    barcode.value !== ''
                ) {
                    const normalized = this.toNormalizedNonEmptyString(
                        barcode.value
                    );
                    if (normalized) collected.push(normalized);
                }
            }
        }

        for (const key of BARCODE_KEYS) {
            const value = row?.[key];
            if (value != null && value !== '') {
                const normalized = this.toNormalizedNonEmptyString(value);

                if (normalized) collected.push(normalized);
            }
        }

        return this.toUniqueStringList(collected);
    }

    public extractSalePriceRub(row: any): number | null {
        const rawValue = row?.salePrices?.[0]?.value;

        const numericValue = Number(rawValue);

        if (!Number.isFinite(numericValue) || numericValue <= 0) return null;

        return Math.round(numericValue) / 100;
    }

    public extractImageUrls(row: MoySkladRowWithImages): string[] {
        const selfRows = row?.images?.rows ?? [];
        const parentRows = row?.product?.images?.rows ?? [];
        const singleRefs: MoySkladImageLike[] = [
            row?.image,
            row?.product?.image,
        ].filter(Boolean) as MoySkladImageLike[];
        const candidates: MoySkladImageLike[] = [
            ...selfRows,
            ...parentRows,
            ...singleRefs,
        ];

        const proxiedUrls: string[] = [];
        for (const candidate of candidates) {
            const absoluteUrl = this.pickAbsoluteImageUrl(candidate);
            if (!absoluteUrl) continue;

            const proxyUrl = this.resolveProxyUrl(absoluteUrl);
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
            return this.toUniqueStringList(preferred);
        }

        return this.toUniqueStringList(proxiedUrls);
    }

    private toNormalizedNonEmptyString(value: unknown): string | null {
        const normalized = String(value ?? '').trim();

        return normalized.length > 0 ? normalized : null;
    }

    private toUniqueStringList(values: string[]): string[] {
        const seen = new Set<string>();

        const result: string[] = [];

        for (const value of values) {
            if (!seen.has(value)) {
                seen.add(value);
                result.push(value);
            }
        }
        return result;
    }

    private safeGetHostname(urlLike: string): string | null {
        try {
            return new URL(urlLike).hostname.toLowerCase();
        } catch {
            return null;
        }
    }

    private resolveProxyUrl(absoluteUrl: string): string | null {
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(absoluteUrl);
        } catch {
            return null;
        }

        const hostname = parsedUrl.hostname.toLowerCase();

        if (hostname === MINIATURE_HOSTNAME) {
            return `/external?url=${encodeURIComponent(absoluteUrl)}`;
        }

        if (hostname === this.moyskladHostname) {
            const isDownload = /\/download\/[0-9a-f-]{36}$/i.test(
                parsedUrl.pathname
            );
            const isEntityImage = /\/entity\/image\/[0-9a-f-]{36}$/i.test(
                parsedUrl.pathname
            );
            if (isDownload || isEntityImage) {
                return `/image-by-url?href=${encodeURIComponent(absoluteUrl)}`;
            }
        }

        return null;
    }

    private pickAbsoluteImageUrl(image: MoySkladImageLike): string | null {
        if (!image) return null;

        if (typeof image === 'string') {
            return this.toNormalizedNonEmptyString(image);
        }

        const fromDownload =
            image.big?.downloadHref ||
            image.medium?.downloadHref ||
            image.small?.downloadHref ||
            image.meta?.downloadHref;

        const normalizedDownload =
            this.toNormalizedNonEmptyString(fromDownload);
        if (normalizedDownload) return normalizedDownload;

        const fromHref =
            image.big?.href ||
            image.medium?.href ||
            image.small?.href ||
            image.meta?.href ||
            image.href;

        const normalizedHref = this.toNormalizedNonEmptyString(fromHref);
        if (normalizedHref) return normalizedHref;

        const fallbacks =
            image.tiny?.downloadHref ||
            image.miniature?.downloadHref ||
            image.tiny?.href ||
            image.miniature?.href;

        return this.toNormalizedNonEmptyString(fallbacks);
    }
}
