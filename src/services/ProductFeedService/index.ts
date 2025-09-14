import { MoySkladService } from '../../MoySkladApi/MoySkladServices/MoySkladService';
import type { IReviewOut, IProductStatsOut } from '../../types/UGCTypes';
import { convertDateToIsoString } from '../../utils/dateTimeAndMath';
import type { IListParams } from '../../MoySkladApi/MoySkladTypes';
import { restrictNumberToRange } from '../../utils/numbers';
import { UgcRepo } from '../../data/UGCRepo';
import {
    PRODUCT_RATING_MAX,
    PRODUCT_RATING_MIN,
    DEFAULT_REVIEWS_LIMIT,
    DEFAULT_NUMERIC_VALUE,
    ANONYMOUS_AUTHOR_FALLBACK,
} from '../../utils/constants';

export class ProductFeedService {
    constructor(
        private readonly msService: MoySkladService,
        private readonly ugcRepo: UgcRepo
    ) {}

    public async listProductsWithUgc(
        params: IListParams & { reviewsLimit?: number }
    ): Promise<Awaited<ReturnType<MoySkladService['listMarketProducts']>>> {
        const response = await this.msService.listMarketProducts(params);
        const baseItems = response.items;
        const productIds = baseItems.map((products) => products.id);

        await this.ugcRepo.ensureProductStats(productIds);

        const [statsMap, reviewsMap] = await Promise.all([
            this.ugcRepo.getStatsByProductIds(productIds),
            this.ugcRepo.getLatestReviewsByProductIds(
                productIds,
                params.reviewsLimit ?? DEFAULT_REVIEWS_LIMIT
            ),
        ]);

        const items = baseItems.map((products) => {
            const stats: IProductStatsOut | undefined = statsMap.get(
                products.id
            );

            const raws: IReviewOut[] = reviewsMap.get(products.id) ?? [];

            const reviews = raws.map(
                (rows): (typeof products.reviews)[number] => ({
                    author:
                        rows.author || rows.userId || ANONYMOUS_AUTHOR_FALLBACK,
                    title: rows.title,
                    text: rows.text,
                    rating: restrictNumberToRange(
                        Number(rows.rating) || PRODUCT_RATING_MIN,
                        PRODUCT_RATING_MIN,
                        PRODUCT_RATING_MAX
                    ) as (typeof products.reviews)[number]['rating'],
                    date: convertDateToIsoString(rows.createdAt),
                    likesCount: rows.likesCount ?? DEFAULT_NUMERIC_VALUE,
                    dislikeCount: rows.dislikeCount ?? DEFAULT_NUMERIC_VALUE,
                })
            ) as typeof products.reviews;

            return {
                ...products,
                reviews,
                salesCount: stats?.salesCount ?? DEFAULT_NUMERIC_VALUE,
                averageRating: stats?.averageRating ?? DEFAULT_NUMERIC_VALUE,
                ratingsCount: stats?.ratingsCount ?? DEFAULT_NUMERIC_VALUE,
            };
        });

        return { ...response, items };
    }
}
