import { TransactionValidationService } from '../../ValidationServices/TransactionValidationService';
import { ITransaction, Transaction } from '../../models/Transaction';

export class TransactionService {
    public static async createTransaction(data: ITransaction) {
        try {
            await TransactionValidationService.validateCreate(data);

            const document = await Transaction.create(data);

            console.log(`Transaction created: ${document._id}`);

            return document;
        } catch (error) {
            console.error('Failed to create transaction', error);

            throw error;
        }
    }

    public static async getTransaction() {
        try {
            const transactionList = await Transaction.find({});

            return transactionList;
        } catch (error) {
            console.error('Failed to get transaction', error);

            throw error;
        }
    }
}
