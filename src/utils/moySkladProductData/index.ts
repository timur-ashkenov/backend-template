import { MINIATURE_HOSTNAME, RE_DOWNLOAD, RE_ENTITY_IMAGE } from '../constants';
import { TMoySkladImageLike } from '../../MoySkladApi/MoySkladTypes';
import { toNormalizedNonEmptyString } from '../strings';

export const resolveProxyUrl = (
    absoluteUrl: string,
    moyskladHostname: string
): string | null => {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(absoluteUrl);
    } catch {
        return null;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname !== MINIATURE_HOSTNAME && hostname !== moyskladHostname) {
        return null;
    }

    if (hostname === MINIATURE_HOSTNAME) {
        return `/external?url=${encodeURIComponent(absoluteUrl)}`;
    }

    const path = parsedUrl.pathname;

    const isAllowed = RE_DOWNLOAD.test(path) || RE_ENTITY_IMAGE.test(path);

    if (!isAllowed) return null;

    return `/image-by-url?href=${encodeURIComponent(absoluteUrl)}`;
};

export const pickAbsoluteImageUrl = (
    image: TMoySkladImageLike
): string | null => {
    if (!image) return null;

    if (typeof image === 'string') {
        return toNormalizedNonEmptyString(image);
    }

    const fromDownload =
        image.big?.downloadHref ||
        image.medium?.downloadHref ||
        image.small?.downloadHref ||
        image.meta?.downloadHref;

    const normalizedDownload = toNormalizedNonEmptyString(fromDownload);
    if (normalizedDownload) return normalizedDownload;

    const fromHref =
        image.big?.href ||
        image.medium?.href ||
        image.small?.href ||
        image.meta?.href ||
        image.href;

    const normalizedHref = toNormalizedNonEmptyString(fromHref);

    if (normalizedHref) return normalizedHref;

    const fallbacks =
        image.tiny?.downloadHref ||
        image.miniature?.downloadHref ||
        image.tiny?.href ||
        image.miniature?.href;

    return toNormalizedNonEmptyString(fallbacks);
};
