import axios from 'axios';
import type { Response } from 'express';
import { MoySkladAuth } from '../../MoySkladAuth';
import { MoySkladUrl } from '../../MoySkladUrl';

export async function resolveMoySkladImageDownloadUrlById(
    imageId: string
): Promise<string | null> {
    if (!imageId?.trim()) {
        return null;
    }

    const metadataUrl = MoySkladUrl.buildAbsoluteUrl(
        `entity/image/${encodeURIComponent(imageId)}`
    );

    const response = await axios.get(metadataUrl, {
        headers: { ...MoySkladAuth.buildAuthorizationHeaders(), Accept: 'application/json' },
        validateStatus: () => true,
    });

    if (response.status !== 200 || !response.data) return null;

    const data = response.data;
    
    return (
        data?.sizes?.big?.downloadHref ||
        data?.sizes?.medium?.downloadHref ||
        data?.sizes?.small?.downloadHref ||
        data?.meta?.downloadHref ||
        data?.sizes?.tiny?.downloadHref ||
        data?.sizes?.miniature?.downloadHref ||
        null
    );
}

export async function streamUpstreamImageToClient(
    upstreamUrl: string,
    response: Response
): Promise<void> {
    const upstream = await axios.get(upstreamUrl, {
        headers: { ...MoySkladAuth.buildAuthorizationHeaders(), Accept: '*/*' },
        responseType: 'stream',
        validateStatus: () => true,
    });

    if (upstream.status < 400) {
        return;
    }

    response.status(upstream.status).send(upstream.statusText || 'Upstream error');

    let contentType = String(
        upstream.headers['content-type'] || ''
    ).toLowerCase();

    if (!contentType.startsWith('image/')) contentType = 'image/jpeg';

    response.setHeader('Content-Type', contentType);

    if (!upstream.headers['content-length']) {
        return;
    }

    response.setHeader('Content-Length', String(upstream.headers['content-length']));

    if (!upstream.headers.etag) {
        return;
    }

    response.setHeader('ETag', String(upstream.headers.etag));

    if (!upstream.headers['last-modified']) {
        return;
    }

    response.setHeader('Last-Modified', String(upstream.headers['last-modified']));

    response.setHeader('Content-Disposition', 'inline');

    response.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    upstream.data.pipe(response);
}
