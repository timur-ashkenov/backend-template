import { MoySkladMarketController } from '../../controllers/moySkladMarketController';
import { MoySkladService } from '../../MoySkladApi/MoySkladServices/MoySkladService';
import { MoySkladImageController } from '../../controllers/moySkladImageController';
import { ProductFeedService } from '../../services/ProductFeedService';
import { MoySkladClient } from '../../MoySkladApi/MoySkladClient';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { UgcRepo } from '../../data/UGCRepo';
import type { Db } from 'mongodb';
import { Router } from 'express';

export function buildMoySkladMarketRouter(database: Db): Router {
    const router = Router();

    const ugcRepository = new UgcRepo(database);

    const moySkladClient = new MoySkladClient({
        baseURL: process.env.MOYSKLAD_BASE_URL!,
        token: process.env.MOYSKLAD_TOKEN,
        basic:
            process.env.MS_USER && process.env.MS_PASS
                ? { user: process.env.MS_USER, pass: process.env.MS_PASS }
                : undefined,
        timeoutMs: Number(process.env.MOYSKLAD_TIMEOUT_MS ?? 10_000),
        maxRetries: Number(process.env.MS_MAX_RETRIES ?? 1),
    });

    const moySkladService = new MoySkladService(moySkladClient);

    const productFeedService = new ProductFeedService(
        moySkladService,
        ugcRepository
    );

    const marketController = new MoySkladMarketController(productFeedService);

    router.get(
        '/image-by-url',
        asyncHandler(MoySkladImageController.proxyImageByHref)
    );

    router.get(
        '/external',
        asyncHandler(MoySkladImageController.proxyExternalMiniature)
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
    router.get('/products', asyncHandler(marketController.fetchMarketProducts));

    return router;
}
