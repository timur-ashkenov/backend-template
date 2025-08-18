import { TransactionService } from '../../services/TransactionService';
import { Request, Router, Response, NextFunction } from 'express';

const router = Router();

/**
 * @swagger
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionCreateInput'
 *     responses:
 *       201:
 *         description: Transaction had been created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Incorrect data
 */
router.post(
    '/transactions',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const transactions = await TransactionService.createTransaction(
                request.body
            );

            response.status(201).json(transactions);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get list of transactions
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
router.get(
    '/transactions',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const transactions = await TransactionService.getTransaction();

            response.status(200).json(transactions);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
