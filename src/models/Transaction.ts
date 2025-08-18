import { Schema, model } from 'mongoose';

export interface ITransaction {
    amount: number;
    userId: string;
    products: string[];
    createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
    amount: {
        type: Number,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    products: {
        type: [String],
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

export const Transaction = model<ITransaction>(
    'Transaction',
    transactionSchema
);
