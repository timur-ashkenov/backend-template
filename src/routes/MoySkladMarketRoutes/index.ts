import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { MoySkladMarketController } from '../../controllers/moySkladMarketController';

const router = Router();

/**
 * @swagger
 * /market/products:
 *   get:
 *     tags: [MoySklad]
 *     summary: List market products
 *     description: Returns a normalized list of items from MyWarehouse (assortment) as a MarketProduct. By default, hides archived products (`archived=false`).
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page size. If includeImages=true and limit > 100 — will be limited to 100.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Selection bias (pagination).
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search of the catalog in Moy sklad.
 *       - in: query
 *         name: includeImages
 *         schema:
 *           type: boolean
 *         description: Pull images (expand=images). The answer is more difficult; the limit is capped at 100.
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *         description: Defaults to true to exclude archived ones. Pass false to return everything.
 *     responses:
 *       200:
 *         description: OK
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
 *         description: Rate limited by upstream
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
router.get('/market/products', asyncHandler(MoySkladMarketController.list));

export default router;
