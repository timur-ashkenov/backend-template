import { Schema, model } from 'mongoose';

export interface IProductBook {
    title: string;
    author: string;
    price: number;
    description?: string;
    stock?: number;
    createdAt?: Date;
}

const productBookSchema = new Schema<IProductBook>({
    title: {
        type: String,
        required: true,
    },

    author: {
        type: String,
        required: true,
    },

    price: {
        type: Number,
        required: true,
    },

    description: {
        type: String,
    },

    stock: {
        type: Number,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const ProductBook = model<IProductBook>(
    'ProductBook',
    productBookSchema
);
