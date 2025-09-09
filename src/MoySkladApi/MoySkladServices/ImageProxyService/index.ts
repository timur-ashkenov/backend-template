import axios from 'axios';
import type { Response } from 'express';
import { MoySkladAuth } from '../../MoySkladAuth';
import { MoySkladUrl } from '../../MoySkladUrl';

export async function resolveMoySkladImageDownloadUrlById(
    imageId: string
): Promise<string | null> {
    const metadataUrl = MoySkladUrl.buildAbsoluteUrl(
        `entity/image/${encodeURIComponent(imageId)}`
    );

    const response = await axios.get(metadataUrl, {
        headers: { ...MoySkladAuth.buildHeaders(), Accept: 'application/json' },
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
    res: Response
): Promise<void> {
    const upstream = await axios.get(upstreamUrl, {
        headers: { ...MoySkladAuth.buildHeaders(), Accept: '*/*' },
        responseType: 'stream',
        validateStatus: () => true,
    });

    if (upstream.status >= 400) {
        res.status(upstream.status).send(
            upstream.statusText || 'Upstream error'
        );
        return;
    }

    let contentType = String(
        upstream.headers['content-type'] || ''
    ).toLowerCase();
    if (!contentType.startsWith('image/')) contentType = 'image/jpeg';

    res.setHeader('Content-Type', contentType);

    if (upstream.headers['content-length']) {
        res.setHeader(
            'Content-Length',
            String(upstream.headers['content-length'])
        );
    }
    if (upstream.headers.etag) {
        res.setHeader('ETag', String(upstream.headers.etag));
    }
    if (upstream.headers['last-modified']) {
        res.setHeader(
            'Last-Modified',
            String(upstream.headers['last-modified'])
        );
    }
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    upstream.data.pipe(res);
}
