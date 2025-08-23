import { ProductController } from '../../controllers/productController';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateInput'
 *     responses:
 *       201:
 *         description: Product had been created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Incorrect data
 */
router.post('/products/create', asyncHandler(ProductController.create));

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Product had been deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.delete('/products/:id', asyncHandler(ProductController.remove));

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update product
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdateInput'
 *     responses:
 *       200:
 *         description: Product had been updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.patch('/products/:id', asyncHandler(ProductController.update));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by id
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', asyncHandler(ProductController.getById));

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Get list of all products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/products', asyncHandler(ProductController.list));

export default router;
