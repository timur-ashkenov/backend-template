import { TransactionService } from '../services/TransactionService';
import { Request, Response } from 'express';

export class TransactionController {
    static async create(request: Request, response: Response) {
        const transaction = await TransactionService.createTransaction(
            request.body
        );

        return response.status(201).json(transaction);
    }

    static async list(request: Request, response: Response) {
        const transaction = await TransactionService.getTransaction();

        return response.status(200).json(transaction);
    }
}
