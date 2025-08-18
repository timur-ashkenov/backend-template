import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Product Store API',
            version: '1.0.0',
            description:
                'REST API to manage products and transactions. CRUD on products and receipt transactions with pre-calculated amount.',
        },
        servers: [
            { url: 'http://localhost:3000/', description: 'Local server' },
        ],
        tags: [
            { name: 'Products', description: 'Operations with products' },
            {
                name: 'Transactions',
                description: 'Operations with transactions',
            },
        ],
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Product identifier',
                        },
                        title: { type: 'string', description: "Book's name" },
                        author: { type: 'string', description: 'Author' },
                        price: {
                            type: 'number',
                            description: 'Cost of product',
                        },
                        description: {
                            type: 'string',
                            description: 'Description',
                        },
                        stock: {
                            type: 'number',
                            description: 'Quantity in stock',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date',
                        },
                    },
                    required: ['title', 'author', 'price'],
                    example: {
                        id: '66d9f2f2c5b7c2f4a1b3d123',
                        title: 'Мастер и Маргарита',
                        author: 'Михаил Булгаков',
                        price: 1200,
                        description: 'Культовый роман XX века',
                        stock: 5,
                        createdAt: '2025-08-17T10:00:00.000Z',
                    },
                },
                ProductCreateInput: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        author: { type: 'string' },
                        price: { type: 'number' },
                        description: { type: 'string' },
                        stock: { type: 'number' },
                    },
                    required: ['title', 'author', 'price'],
                },
                ProductUpdateInput: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        author: { type: 'string' },
                        price: { type: 'number' },
                        description: { type: 'string' },
                        stock: { type: 'number' },
                    },
                    additionalProperties: false,
                },

                Transaction: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Transaction identifier',
                        },
                        userId: {
                            type: 'string',
                            description: 'User identifier',
                        },
                        amount: {
                            type: 'number',
                            description: 'Transaction amount',
                        },
                        products: {
                            type: 'array',
                            description: 'List id of bought products',
                            items: { type: 'string' },
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date',
                        },
                    },
                    required: ['userId', 'amount', 'products'],
                    example: {
                        id: '66da00a0c5b7c2f4a1b3d999',
                        userId: 'user123',
                        amount: 2500,
                        products: [
                            '66d9f2f2c5b7c2f4a1b3d123',
                            '66d9f2f2c5b7c2f4a1b3d456',
                        ],
                        createdAt: '2025-08-17T10:30:00.000Z',
                    },
                },
                TransactionCreateInput: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                        amount: { type: 'number' },
                        products: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['userId', 'amount', 'products'],
                },
            },
            parameters: {
                IdParam: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Resource identifier (ObjectId)',
                },
            },
        },
    },
    apis: [
        path.join(__dirname, '../routes/**/*.ts'),
        path.join(__dirname, '../routes/**/*.js'),
    ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app: Express): void => {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/docs.json', (_req, res) => res.json(swaggerSpec));
};
