import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { MoySkladMarketController } from '../../controllers/moySkladMarketController';

const router = Router();

/**
 * @swagger
 * /market/products:
 *   get:
 *     tags: [MoySklad]
 *     summary: List market products (normalized from MoySklad)
 *     description: >
 *       Returns a frontend-ready list of products mapped from MoySklad assortment
 *       (title, price, availability, images, attributes, etc.). Also returns
 *       pagination (`nextOffset`) and upstream rate-limit info (`rate`).
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page size. When includeImages=true and limit > 100, it is capped at 100 due to MoySklad expand limitations.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Pagination offset.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search within MoySklad assortment (e.g., by name or article).
 *       - in: query
 *         name: includeImages
 *         schema:
 *           type: boolean
 *         description: If true, image URLs are pulled (expand=images). This may impact performance; limit is capped at 100.
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *         description: By default, archived products are excluded (archived=false). Pass false to include all.
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListMarketProductsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limited by upstream (MoySklad)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       5XX:
 *         description: Upstream/server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.get('/products', asyncHandler(MoySkladMarketController.fetchMarketProducts));

export default router;
