import axios from 'axios';
import type { Request, Response } from 'express';
import { MoySkladAuth } from '../MoySkladApi/MoySkladAuth';
import { MoySkladUrl } from '../MoySkladApi/MoySkladUrl';
import {
    resolveMoySkladImageDownloadUrlById,
    streamUpstreamImageToClient,
} from '../MoySkladApi/MoySkladServices/ImageProxyService';
import {
    ALLOWED_MINIATURE_HOSTNAMES,
    UNIVERSALLY_UNIQUE_IDENTIFIER_PATTERN,
} from '../utils/constants';

export class MoySkladImageController {
    public static async proxyImageByHref(
        request: Request,
        response: Response
    ): Promise<void> {
        const rawHref = String(request.query.href || '');

        if (!rawHref) {
            response.status(400).send('href required');
            
            return;
        }

        const hrefUrl = (() => {
            try {
                return new URL(rawHref);
            } catch {
                return null;
            }
        })();

        if (!hrefUrl) {
            response.status(400).send('Bad href');

            return;
        }

        const moySkladHost = MoySkladUrl.getHostname();

        if (hrefUrl.hostname.toLowerCase() !== moySkladHost) {
            response.status(400).send('Host not allowed');

            return;
        }

        const downloadId =
            hrefUrl.pathname
                .match(/\/download\/([0-9a-f-]{36})$/i)?.[1]
                ?.toLowerCase() ?? null;

        const entityId =
            hrefUrl.pathname
                .match(/\/entity\/image\/([0-9a-f-]{36})$/i)?.[1]
                ?.toLowerCase() ?? null;

        const isEntityValid = !!(
            entityId && UNIVERSALLY_UNIQUE_IDENTIFIER_PATTERN.test(entityId)
        );

        const isDownloadValid = !!(
            downloadId && UNIVERSALLY_UNIQUE_IDENTIFIER_PATTERN.test(downloadId)
        );

        if (!isEntityValid && !isDownloadValid) {
            response.status(400).send('Unsupported href path');

            return;
        }

        const withDebug = request.query.debug === '1';

        let finalUrl: string | null = null;

        let headStatus: number | null = null;

        let metaStatus: number | null = null;

        let metaAttempted = false;

        try {
            if (!isEntityValid) {
                return;
            }

            metaAttempted = true;

            finalUrl = await resolveMoySkladImageDownloadUrlById(entityId!);

            metaStatus = finalUrl ? 200 : 404;

            if (!finalUrl && isDownloadValid) {
                const head = await axios.head(rawHref, {
                    headers: MoySkladAuth.buildHeaders(),
                    validateStatus: () => true,
                });

                headStatus = head.status;

                if (head.status === 200) finalUrl = rawHref;
            }

            if (!finalUrl && isDownloadValid) {
                metaAttempted = true;

                finalUrl = await resolveMoySkladImageDownloadUrlById(
                    downloadId!
                );

                metaStatus = finalUrl ? 200 : 404;
            }

            if (!withDebug) {
                return;
            }

            response.json({
                ok: !!finalUrl,
                hrefIn: rawHref,
                finalUrl,
                headStatus,
                metaAttempted,
                metaStatus,
            });

            if (!finalUrl) {
                response.status(404).send('Image not found');

                return;
            }

            await streamUpstreamImageToClient(finalUrl, response);
        } catch (error) {
            console.error('image-by-url proxy error:', error);

            response.status(502).send('Image proxy failed');
        }
    }

    public static async proxyExternalMiniature(
        request: Request,
        response: Response
    ): Promise<void> {
        const rawUrl = String(request.query.url || '');

        if (!rawUrl) {
            response.status(400).send('url required');

            return;
        }

        const parsed = (() => {
            try {
                return new URL(rawUrl);
            } catch {
                return null;
            }
        })();

        if (!parsed) {
            response.status(400).send('Bad url');

            return;
        }

        if (!ALLOWED_MINIATURE_HOSTNAMES.has(parsed.hostname)) {
            response.status(400).send('Host not allowed');

            return;
        }

        await streamUpstreamImageToClient(rawUrl, response);
    }
}
