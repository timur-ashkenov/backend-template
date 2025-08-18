import { TransactionService } from '../../services/TransactionService';
import { Request, Router, Response } from 'express';

const router = Router();

router.post('/transactions', async (request: Request, response: Response) => {
    try {
        const transactions = await TransactionService.createTransaction(request.body);

        response.status(201).json(transactions);
    } catch (error) {
        response.status(400).json({ error: 'Failed to create transaction '});
    }
});

router.get('/transactions', async (request: Request, response: Response) => {
    try {
        const transactions = await TransactionService.getTransaction();

        response.status(200).json(transactions);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

export default router;
