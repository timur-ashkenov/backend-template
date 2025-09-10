import type { ReviewOut, ProductStatsOut } from '../../types/UGCTypes';
import type { ListParams } from '../../MoySkladApi/MoySkladTypes';
import { MoySkladService } from '../../MoySkladApi/MoySkladServices/MoySkladService';
import { UgcRepo } from '../../data/UGCRepo';

export class ProductFeedService {
    constructor(
        private readonly msService: MoySkladService,
        private readonly ugcRepo: UgcRepo
    ) {}

    private clamp(numeric: number, min: number, max: number) {
        return Math.min(max, Math.max(min, numeric));
    }
    private toIso(date: Date | string) {
        return date instanceof Date
            ? date.toISOString()
            : new Date(date).toISOString();
    }

    public async listProductsWithUgc(
        params: ListParams & { reviewsLimit?: number }
    ): Promise<Awaited<ReturnType<MoySkladService['listMarketProducts']>>> {
        const response = await this.msService.listMarketProducts(params);

        const baseItems = response.items;

        const productIds = baseItems.map((products) => products.id);

        await this.ugcRepo.ensureProductStats(productIds);

        const [statsMap, reviewsMap] = await Promise.all([
            this.ugcRepo.getStatsByProductIds(productIds),
            this.ugcRepo.getLatestReviewsByProductIds(
                productIds,
                params.reviewsLimit ?? 3
            ),
        ]);

        const items = baseItems.map((products) => {
            const stats: ProductStatsOut | undefined = statsMap.get(
                products.id
            );

            const raws: ReviewOut[] = reviewsMap.get(products.id) ?? [];

            const reviews = raws.map(
                (rows): (typeof products.reviews)[number] => ({
                    author: rows.author || rows.userId || 'Аноним',
                    title: rows.title,
                    text: rows.text,
                    rating: this.clamp(
                        Number(rows.rating) || 1,
                        1,
                        4
                    ) as (typeof products.reviews)[number]['rating'],
                    date: this.toIso(rows.createdAt),
                    likesCount: rows.likesCount ?? 0,
                    dislikeCount: rows.dislikeCount ?? 0,
                })
            ) as typeof products.reviews;

            return {
                ...products,
                reviews,
                salesCount: stats?.salesCount ?? 0,
                averageRating: stats?.averageRating ?? 0,
                ratingsCount: stats?.ratingsCount ?? 0,
            };
        });

        return { ...response, items };
    }
}
