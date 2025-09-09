import { Router } from 'express';
import type { Db } from 'mongodb';
import axios from 'axios';
import { asyncHandler } from '../../middlewares/asyncHandler';

import { UgcRepo } from '../../data/UGCRepo';
import { ProductFeedService } from '../../services/ProductFeedService';
import { MoySkladClient } from '../../MoySkladApi/MoySkladClient';
import { MoySkladService } from '../../MoySkladApi/MoySkladServices/MoySkladService';
import { MoySkladMarketController } from '../../controllers/moySkladMarketController';

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildMoySkladAuthHeaders(): Record<string, string> {
    if (process.env.MOYSKLAD_TOKEN) {
        return { Authorization: `Bearer ${process.env.MOYSKLAD_TOKEN}` };
    }
    if (process.env.MS_USER && process.env.MS_PASS) {
        const basic = Buffer.from(
            `${process.env.MS_USER}:${process.env.MS_PASS}`
        ).toString('base64');
        return { Authorization: `Basic ${basic}` };
    }
    return {};
}

function buildMoySkladUrl(path: string): string {
    const base = (
        process.env.MOYSKLAD_BASE_URL || 'https://api.moysklad.ru/api/remap/1.2'
    ).replace(/\/+$/, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
}

async function resolveDownloadHrefById(
    imageId: string
): Promise<string | null> {
    const metaUrl = buildMoySkladUrl(
        `entity/image/${encodeURIComponent(imageId)}`
    );
    const response = await axios.get(metaUrl, {
        headers: { ...buildMoySkladAuthHeaders(), Accept: 'application/json' },
        validateStatus: () => true,
    });

    if (response.status !== 200 || !response.data) return null;

    return (
        response.data?.sizes?.big?.downloadHref ||
        response.data?.sizes?.medium?.downloadHref ||
        response.data?.sizes?.small?.downloadHref ||
        response.data?.meta?.downloadHref ||
        response.data?.sizes?.tiny?.downloadHref ||
        response.data?.sizes?.miniature?.downloadHref ||
        null
    );
}

async function streamImageResponse(
    upstreamUrl: string,
    response: any
): Promise<void> {
    const upstream = await axios.get(upstreamUrl, {
        headers: { ...buildMoySkladAuthHeaders(), Accept: '*/*' },
        responseType: 'stream',
        validateStatus: () => true,
    });

    if (upstream.status >= 400) {
        response.status(upstream.status).send(
            upstream.statusText || 'Upstream error'
        );
        return;
    }

    let contentType = String(
        upstream.headers['content-type'] || ''
    ).toLowerCase();
    if (!contentType.startsWith('image/')) contentType = 'image/jpeg';

    response.setHeader('Content-Type', contentType);
    if (upstream.headers['content-length']) {
        response.setHeader(
            'Content-Length',
            String(upstream.headers['content-length'])
        );
    }
    if (upstream.headers.etag) {
        response.setHeader('ETag', String(upstream.headers.etag));
    }
    if (upstream.headers['last-modified']) {
        response.setHeader(
            'Last-Modified',
            String(upstream.headers['last-modified'])
        );
    }
    response.setHeader('Content-Disposition', 'inline');

    response.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    upstream.data.pipe(response);
}

export function buildMoySkladMarketRouter(db: Db): Router {
    const router = Router();

    const ugcRepo = new UgcRepo(db);

    const moySkladClient = new MoySkladClient({
        baseURL: process.env.MOYSKLAD_BASE_URL!,
        token: process.env.MOYSKLAD_TOKEN,
        basic:
            process.env.MS_USER && process.env.MS_PASS
                ? { user: process.env.MS_USER, pass: process.env.MS_PASS }
                : undefined,
        timeoutMs: Number(process.env.MOYSKLAD_TIMEOUT_MS ?? 10000),
        maxRetries: Number(process.env.MS_MAX_RETRIES ?? 1),
    });

    const moySkladService = new MoySkladService(moySkladClient);
    const feedService = new ProductFeedService(
        moySkladService,
        ugcRepo
    );
    const controller = new MoySkladMarketController(feedService);

    router.get(
        '/image-by-url',
        asyncHandler(async (request, response) => {
            const rawHref = String(request.query.href || '');

            if (!rawHref) return response.status(400).send('href required');

            let hrefUrl: URL;
            
            try {
                hrefUrl = new URL(rawHref);
            } catch {
                return response.status(400).send('Bad href');
            }

            const moySkladHost = (() => {
                try {
                    return new URL(
                        process.env.MOYSKLAD_BASE_URL ||
                            'https://api.moysklad.ru/api/remap/1.2/'
                    ).hostname.toLowerCase();
                } catch {
                    return 'api.moysklad.ru';
                }
            })();

            if (hrefUrl.hostname.toLowerCase() !== moySkladHost) {
                return response.status(400).send('Host not allowed');
            }

            const downloadId =
                hrefUrl.pathname
                    .match(/\/download\/([0-9a-f-]{36})$/i)?.[1]
                    ?.toLowerCase() ?? null;
            const entityId =
                hrefUrl.pathname
                    .match(/\/entity\/image\/([0-9a-f-]{36})$/i)?.[1]
                    ?.toLowerCase() ?? null;

            const debug = request.query.debug === '1';

            let finalUrl: string | null = null;

            let headStatus: number | null = null;

            let metaStatus: number | null = null;

            let metaTried = false;

            try {
                if (entityId && UUID_PATTERN.test(entityId)) {
                    metaTried = true;

                    finalUrl = await resolveDownloadHrefById(entityId);

                    metaStatus = finalUrl ? 200 : 404;

                } else if (downloadId && UUID_PATTERN.test(downloadId)) {
                    const head = await axios.head(rawHref, {
                        headers: buildMoySkladAuthHeaders(),
                        validateStatus: () => true,
                    });

                    headStatus = head.status;

                    if (head.status === 200) {
                        finalUrl = rawHref;
                    } else {
                        metaTried = true;
                        finalUrl = await resolveDownloadHrefById(downloadId);
                        metaStatus = finalUrl ? 200 : 404;
                    }
                } else {
                    return response.status(400).send('Unsupported href path');
                }

                if (debug) {
                    return response.json({
                        ok: !!finalUrl,
                        hrefIn: rawHref,
                        finalUrl,
                        headStatus,
                        metaTried,
                        metaStatus,
                    });
                }

                if (!finalUrl) return response.status(404).send('Image not found');

                await streamImageResponse(finalUrl, response);

            } catch (error) {
                console.error('image-by-url proxy error:', error);

                response.status(502).send('Image proxy failed');
            }
        })
    );

    router.get(
        '/external',
        asyncHandler(async (request, response) => {
            const rawUrl = String(request.query.url || '');
            if (!rawUrl) return response.status(400).send('url required');

            let parsed: URL;
            try {
                parsed = new URL(rawUrl);
            } catch {
                return response.status(400).send('Bad url');
            }

            const allowedHosts = new Set(['miniature-prod.moysklad.ru']);
            if (!allowedHosts.has(parsed.hostname)) {
                return response.status(400).send('Host not allowed');
            }

            const upstream = await axios.get(rawUrl, {
                responseType: 'stream',
                validateStatus: () => true,
            });

            if (upstream.status >= 400) {
                return response
                    .status(upstream.status)
                    .send(upstream.statusText || 'Upstream error');
            }

            let contentType = String(
                upstream.headers['content-type'] || ''
            ).toLowerCase();
            if (!contentType.startsWith('image/')) contentType = 'image/jpeg';

            response.setHeader('Content-Type', contentType);

            if (upstream.headers['content-length']) {
                response.setHeader(
                    'Content-Length',
                    String(upstream.headers['content-length'])
                );
            }
            response.setHeader('Content-Disposition', 'inline');

            response.setHeader('Cache-Control', 'public, max-age=86400, immutable');

            upstream.data.pipe(response);
        })
    );

    /**
     * @openapi
     * /products:
     *   get:
     *     tags:
     *       - MoySklad
     *     summary: List products (MoySklad) enriched with UGC from MongoDB
     *     description: >
     *      Returning frot list of products from MoySklad with additional UGC attributes (reviews, salesCount, ratingsCount, averageRating) from MongoDB.
     *     parameters:
     *       - in: query
     *         name: limit
     *         description: Page size.
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 50
     *       - in: query
     *         name: offset
     *         description: Offset for pagination.
     *         schema:
     *           type: integer
     *           minimum: 0
     *           default: 0
     *       - in: query
     *         name: search
     *         description: Search by MoySklad assortiment.
     *         schema:
     *           type: string
     *       - in: query
     *         name: includeImages
     *         description: If true - pull image URLs (expand=images in MS).
     *         schema:
     *           type: boolean
     *       - in: query
     *         name: onlyActive
     *         description: By default, we exclude archived products (archived=false). Pass false to include everything.
     *         schema:
     *           type: boolean
     *       - in: query
     *         name: reviewsLimit
     *         description: How many recent reviews to return to a product.
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 3
     *     responses:
     *       200:
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ListMarketProductsResponse'
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       429:
     *         description: Rate limited by upstream (MoySklad)
     *       5XX:
     *         description: Upstream/server error
     *
     * components:
     *   schemas:
     *     Review:
     *       type: object
     *       properties:
     *         author:
     *           type: string
     *           example: "Ирина"
     *         title:
     *           type: string
     *           nullable: true
     *           example: "книга, которая зацепила"
     *         text:
     *           type: string
     *           example: "Читается легко, сюжет увлёк с первых страниц..."
     *         rating:
     *           type: integer
     *           enum: [1, 2, 3, 4]
     *           example: 3
     *         date:
     *           type: string
     *           format: date-time
     *           example: "2025-08-26T00:00:00.000Z"
     *         likesCount:
     *           type: integer
     *           example: 0
     *         dislikeCount:
     *           type: integer
     *           example: 0
     *
     *     Product:
     *       type: object
     *       properties:
     *         id: { type: string, example: "5f5d292c-8767-11f0-0a80-16b10002c83d" }
     *         title: { type: string, example: "Завтра, завтра" }
     *         price: { type: number, example: 690 }
     *         discount: { type: number, example: 0 }
     *         isAvailable: { type: boolean, example: true }
     *         quantity: { type: integer, example: 12 }
     *         coverType: { type: string, example: "PAPERBACK" }
     *         pagesCount: { type: integer, example: 422 }
     *         weight: { type: number, example: 0.344 }
     *         annotation: { type: string }
     *         publisher: { type: string, example: "Альпина Паблишер" }
     *         publisherBrand: { type: string, example: "Бель Летр" }
     *         buyReasons:
     *           type: array
     *           items: { type: string }
     *         ageRating: { type: string, example: "16+" }
     *         publicationYear: { type: string, example: "2023" }
     *         ISBN: { type: string, example: "978-5-00167-101-1" }
     *         imagesUrls:
     *           type: array
     *           items: { type: string }
     *         reviews:
     *           type: array
     *           items:
     *             $ref: '#/components/schemas/Review'
     *         reviewsCount:
     *           type: integer
     *           nullable: true
     *           example: 4
     *         salesCount:
     *           type: integer
     *           example: 488
     *         ratingsCount:
     *           type: integer
     *           example: 162
     *         averageRating:
     *           type: number
     *           format: float
     *           example: 4.5
     *
     *     ListMarketProductsResponse:
     *       type: object
     *       properties:
     *         items:
     *           type: array
     *           items:
     *             $ref: '#/components/schemas/Product'
     *         nextOffset:
     *           type: integer
     *           nullable: true
     *           example: 100
     *         rate:
     *           type: object
     *           additionalProperties: true
     *           description: Rate-limit information from MoySklad (as is from the headers).
     */
    router.get('/products', asyncHandler(controller.fetchMarketProducts));

    return router;
}
