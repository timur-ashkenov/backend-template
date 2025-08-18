import { ProductService } from '../../services/ProductService';
import { Request, Router, Response, NextFunction } from 'express';

const router = Router();

/**
 * @swagger
 * /products/create:
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
router.post(
    '/products/create',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const products = await ProductService.createProduct(request.body);

            response.status(201).json(products);
        } catch (error) {
            next(error);
        }
    }
);

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
router.delete(
    '/products/:id',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const products = await ProductService.deleteProduct(
                request.params.id
            );

            response.status(200).json(products);
        } catch (error) {
            next(error);
        }
    }
);

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
router.patch(
    '/products/:id',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const products = await ProductService.updateProduct(
                request.params.id,
                request.body
            );

            response.status(200).json(products);
        } catch (error) {
            next(error);
        }
    }
);

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
router.get(
    '/products/:id',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const products = await ProductService.getProductById(
                request.params.id
            );

            response.status(200).json(products);
        } catch (error) {
            next(error);
        }
    }
);

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
router.get(
    '/products',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const products = await ProductService.getListOfProducts();

            response.status(200).json(products);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
