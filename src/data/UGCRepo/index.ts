import type { Db, Collection } from 'mongodb';
import type {
    IReviewDoc,
    IProductStatsDoc,
    IReviewOut,
    IProductStatsOut,
} from '../../types/UGCTypes';
import { DEFAULT_NUMERIC_VALUE } from '../../utils/constants';
import { mapReviewDocToOut } from '../../utils/reviewMapper';

export class UgcRepo {
    private readonly productStats: Collection<IProductStatsDoc>;
    private readonly reviews: Collection<IReviewDoc>;

    constructor(database: Db) {
        this.productStats =
            database.collection<IProductStatsDoc>('productStats');

        this.reviews = database.collection<IReviewDoc>('reviews');
    }

    async ensureProductStats(productIds: string[]): Promise<void> {
        if (!productIds.length) return;

        const bulkOps = productIds.map((pid) => ({
            updateOne: {
                filter: { productId: pid },
                update: {
                    $setOnInsert: {
                        productId: pid,
                        salesCount: DEFAULT_NUMERIC_VALUE,
                        ratingsCount: DEFAULT_NUMERIC_VALUE,
                        averageRating: DEFAULT_NUMERIC_VALUE,
                        reviewsCount: DEFAULT_NUMERIC_VALUE,
                    },
                },
                upsert: true,
            },
        }));

        await this.productStats.bulkWrite(bulkOps, { ordered: false });
    }

    async getStatsByProductIds(
        productIds: string[]
    ): Promise<Map<string, IProductStatsOut>> {
        if (!productIds.length) return new Map();

        const documents = await this.productStats
            .find({ productId: { $in: productIds } })
            .project<IProductStatsDoc>({
                _id: 0,
                productId: 1,
                salesCount: 1,
                ratingsCount: 1,
                averageRating: 1,
            })
            .toArray();

        const result = new Map<string, IProductStatsOut>();

        for (const document of documents) {
            result.set(document.productId, {
                productId: document.productId,
                salesCount: document.salesCount ?? DEFAULT_NUMERIC_VALUE,
                ratingsCount: document.ratingsCount ?? DEFAULT_NUMERIC_VALUE,
                averageRating: document.averageRating ?? DEFAULT_NUMERIC_VALUE,
            });
        }

        return result;
    }

    async getLatestReviewsByProductIds(
        productIds: string[],
        limitPerProduct = 3
    ): Promise<Map<string, IReviewOut[]>> {
        if (!productIds.length) return new Map();

        const pipeline = [
            { $match: { productId: { $in: productIds } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$productId',
                    reviews: { $push: '$$ROOT' },
                },
            },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    reviews: { $slice: ['$reviews', limitPerProduct] },
                },
            },
        ] as const;

        const rows = await this.reviews
            .aggregate<{
                productId: string;
                reviews: IReviewDoc[];
            }>(pipeline as any)
            .toArray();

        const map = new Map<string, IReviewOut[]>();

        for (const row of rows) {
            const list = row.reviews.map(mapReviewDocToOut);
            map.set(row.productId, list);
        }
        return map;
    }
}
