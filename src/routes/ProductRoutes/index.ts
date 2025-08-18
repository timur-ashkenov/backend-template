import { ProductService } from '../../services/ProductService';
import { Request, Router, Response } from 'express';

const router = Router();

router.post('/products', async (request: Request, response: Response) => {
    try {
        const products = await ProductService.createProduct(request.body);

        response.status(201).json(products);
    } catch (error) {
        response.status(400).json({ error: 'Failed to create product'});
    }
});

router.delete('/products/:id', async (request: Request, response: Response) => {
    try {
        const products = await ProductService.deleteProduct(request.params.id);

        response.status(200).json(products);
    } catch (error) {
        response.status(404).json({ error: 'Failed to delete product' });

    }
});

router.patch('/products/:id', async (request: Request, response: Response) => {
    try {
        const products = await ProductService.updateProduct(
            request.params.id,
            request.body
        );

        response.status(200).json(products);
    } catch (error) {
        response.status(404).json({ error: 'Failed to update'});
    }
});

router.get('/products/:id', async (request: Request, response: Response) => {
    try {
        const products = await ProductService.getProductById(request.params.id);

        response.status(200).json(products);
    } catch (error) {
        response.status(404).json({ error: 'Product not found' });
    }
});

router.get('/products', async (request: Request, response: Response) => {
    try {
        const products = await ProductService.getListOfProducts();

        response.status(200).json(products);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch products' });
    }
});

export default router;
