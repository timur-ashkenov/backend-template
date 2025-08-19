import { TransactionController } from '../../controllers/transactionController';
import { TransactionService } from '../../services/TransactionService';
import { Request, Router, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';

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
router.post('/transactions', asyncHandler(TransactionController.create));

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
router.get('/transactions', asyncHandler(TransactionController.list));

export default router;
