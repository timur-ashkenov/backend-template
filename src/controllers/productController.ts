import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
  static async create(request: Request, response: Response) {
    const product = await ProductService.createProduct(request.body);

    return response.status(201).json(product);
  }

  static async remove(request: Request, response: Response) {
    const product = await ProductService.deleteProduct(request.params.id);

    return response.status(200).json(product);      
  }

  static async update(request: Request, response: Response) {
    const product = await ProductService.updateProduct(request.params.id, request.body);

    return response.status(200).json(product);
  }

  static async getById(request: Request, response: Response) {
    const product = await ProductService.getProductById(request.params.id);

    return response.status(200).json(product);
  }

  static async list(request: Request, response: Response) {
    const products = await ProductService.getListOfProducts();
    
    return response.status(200).json(products);
  }
}
