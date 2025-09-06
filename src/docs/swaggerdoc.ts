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
                'REST API to manage products and transactions. Includes a MoySklad integration that normalizes assortment items into a frontend-friendly product shape.',
        },
        servers: [
            { url: 'http://localhost:3000/', description: 'Local server' },
        ],
        tags: [
            {
                name: 'Transactions',
                description: 'Operations with transactions',
            },
            {
                name: 'MoySklad',
                description: 'Integration with MoySklad (assortment)',
            },
            { name: 'Auth', description: 'Email verification flow' },
        ],
        components: {
            schemas: {
                Review: {
                    type: 'object',
                    properties: {
                        author: { type: 'string', example: 'Ирина' },
                        title: {
                            type: 'string',
                            nullable: true,
                            example: 'книга, которая зацепила',
                        },
                        text: {
                            type: 'string',
                            example: 'Читается легко, сюжет увлёк...',
                        },
                        rating: {
                            type: 'integer',
                            enum: [1, 2, 3, 4],
                            example: 3,
                        },
                        date: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-08-26T00:00:00.000Z',
                        },
                        likesCount: { type: 'integer', example: 0 },
                        dislikeCount: { type: 'integer', example: 0 },
                    },
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
                            description: 'List of purchased product IDs',
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

                EmailRequest: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'test@example.com',
                        },
                    },
                },

                EmailVerifyRequest: {
                    type: 'object',
                    required: ['email', 'code'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'test@example.com',
                        },
                        code: {
                            type: 'string',
                            pattern: '^\\d{6}$',
                            example: '123456',
                        },
                    },
                },

                AuthOk: {
                    type: 'object',
                    properties: { ok: { type: 'boolean', example: true } },
                },

                AuthVerifyOk: {
                    type: 'object',
                    properties: {
                        ok: { type: 'boolean', example: true },
                        userExists: { type: 'boolean', example: false },
                    },
                },

                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'invalid_code' },
                    },
                },

                MarketCatalogItem: {
                    type: 'object',
                    description:
                        'Frontend-normalized product mapped from MoySklad assortment.',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'MoySklad product GUID',
                        },
                        title: { type: 'string', description: 'Display name' },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Sale price',
                        },
                        discount: {
                            type: 'number',
                            format: 'float',
                            description: 'Discount value',
                        },
                        isAvailable: {
                            type: 'boolean',
                            description:
                                'Availability (stock > 0 with reserve considered)',
                        },
                        quantity: {
                            type: 'integer',
                            description: 'Available quantity (stock - reserve)',
                            example: 12,
                        }, 
                        coverType: {
                            type: 'string',
                            enum: ['PAPERBACK', 'HARDCOVER', 'DIGITAL'], // ← добавили DIGITAL
                            description: 'Cover type',
                        },
                        pagesCount: {
                            type: 'integer',
                            description: 'Pages count',
                        },
                        weight: {
                            type: 'number',
                            format: 'float',
                            description: 'Weight in kg',
                            example: 0.344,
                        },
                        annotation: {
                            type: 'string',
                            description: 'Short description/annotation',
                        },
                        publisher: { type: 'string', description: 'Publisher' },
                        publisherBrand: {
                            type: 'string',
                            description: 'Publisher brand',
                        },
                        buyReasons: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Bulleted “reasons to buy”',
                        },
                        ageRating: {
                            type: 'string',
                            description: 'Age rating (e.g., "16+")',
                        },
                        publicationYear: {
                            type: 'string',
                            description: 'Publication year',
                        },
                        ISBN: { type: 'string', description: 'ISBN' },
                        reviews: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Review' }, 
                        },
                        reviewsCount: {
                            type: 'integer',
                            nullable: true,
                            example: 4,
                        }, 
                        salesCount: {
                            type: 'integer',
                            description: 'Sales counter',
                        },
                        averageRating: {
                            type: 'number',
                            format: 'float',
                            description: 'Average rating (0 if none)',
                        },
                        ratingsCount: {
                            type: 'integer',
                            description: 'Ratings count',
                        },

                        imagesUrls: {
                            type: 'array',
                            items: { type: 'string', format: 'uri' },
                            description: 'Image URLs resolved from MoySklad',
                        },
                    },
                    required: [
                        'id',
                        'title',
                        'price',
                        'isAvailable',
                        'coverType',
                        'pagesCount',
                        'weight',
                        'imagesUrls',
                    ],
                },

                RateInfo: {
                    type: 'object',
                    description:
                        'Upstream rate-limit information from MoySklad.',
                    properties: {
                        limit: {
                            type: 'integer',
                            description: 'Max requests per window',
                        },
                        remaining: {
                            type: 'integer',
                            description: 'Remaining requests in current window',
                        },
                        retryAfter: {
                            type: 'integer',
                            description: 'Seconds until retry (when limited)',
                        },
                    },
                    required: ['limit', 'remaining', 'retryAfter'],
                },

                ListMarketProductsResponse: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            description:
                                'Normalized list of bestseller-ready products',
                            items: {
                                $ref: '#/components/schemas/MarketCatalogItem',
                            },
                        },
                        nextOffset: {
                            type: 'integer',
                            nullable: true,
                            description:
                                'Offset for the next page; omitted on the last page',
                        },
                        rate: { $ref: '#/components/schemas/RateInfo' },
                    },
                    required: ['items', 'rate'],
                    example: {
                        items: [
                            {
                                id: '5f5d292c-8767-11f0-0a80-16b10002c83d',
                                title: 'Tomorrow, Tomorrow',
                                price: 690,
                                discount: 21,
                                isAvailable: true,
                                coverType: 'PAPERBACK',
                                pagesCount: 422,
                                weight: 0.344,
                                annotation: 'Short annotation...',
                                publisher: 'Alpina Publisher',
                                publisherBrand: 'Bel Lettre',
                                buyReasons: [
                                    'New novel...',
                                    'Story of courage...',
                                    '1960s Italy...',
                                ],
                                ageRating: '16+',
                                publicationYear: '2023',
                                ISBN: '978-5-00167-101-1',
                                reviews: [],
                                salesCount: 0,
                                averageRating: 0,
                                ratingsCount: 0,
                                imagesUrls: [
                                    'https://api.moysklad.ru/api/remap/1.2/download/XXXX',
                                ],
                            },
                        ],
                        nextOffset: 50,
                        rate: { limit: 60, remaining: 59, retryAfter: 0 },
                    },
                },
            },

            parameters: {
                IdParam: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Resource identifier (ObjectId or GUID)',
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
