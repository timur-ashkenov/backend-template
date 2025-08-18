import { ITransaction } from '../../models/Transaction';
import { UnprocessableEntityError, NotFoundError } from '../../errors';

export class TransactionValidationService {
    public static validateCreate(data: ITransaction): void {
        if (!data.amount || data.amount <= 0) {
            throw new UnprocessableEntityError(
                'Amount must be greater than null'
            );
        }

        if (!data.userId) {
            throw new UnprocessableEntityError('User ID is required');
        }

        if (!data.products || data.products.length === 0) {
            throw new NotFoundError('At least one product must be provided');
        }
    }
}
