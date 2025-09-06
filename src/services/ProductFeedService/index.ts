import { UgcRepo } from '../../data/UGCRepo';
import type { ReviewOut, ProductStatsOut } from '../../types/UGCTypes';
import type { ListParams } from '../../MoySkladApi/MoySkladTypes';
import { MoySkladService } from '../../MoySkladApi/MoySkladServices/MoySkladService';

import { UgcMetaRepo } from '../../data/UGCMetaRepo';

export class ProductFeedService {
    constructor(
        private readonly msService: MoySkladService,
        private readonly ugcRepo: UgcRepo,
        private readonly ugcMetaRepo: UgcMetaRepo
    ) {}

    private clamp(numeric: number, min: number, max: number) {
        return Math.min(max, Math.max(min, numeric));
    }

    private toIso(date: Date | string) {
        return date instanceof Date
            ? date.toISOString()
            : new Date(date).toISOString();
    }

    private emptyStr(value: unknown) {
        return value === undefined || value === null || value === '';
    }

    private emptyArr(value: unknown) {
        return !Array.isArray(value) || value.length === 0;
    }

    private isZeroNum(value: unknown) {
        return typeof value === 'number' && value === 0;
    }

    public async listProductsWithUgc(
        params: ListParams & { reviewsLimit?: number }
    ): Promise<Awaited<ReturnType<MoySkladService['listMarketProducts']>>> {
        const response = await this.msService.listMarketProducts(params);

        const baseItems = response.items;

        const productIds = baseItems.map((products) => products.id);

        await this.ugcRepo.ensureProductStats(productIds);

        const [statsMap, reviewsMap, metaByProductId] = await Promise.all([
            this.ugcRepo.getStatsByProductIds(productIds),
            this.ugcRepo.getLatestReviewsByProductIds(
                productIds,
                params.reviewsLimit ?? 3
            ),
            this.ugcMetaRepo.getByProductIds(productIds), 
        ]);

        const items = baseItems.map((product) => {
            const raws: ReviewOut[] = reviewsMap.get(product.id) ?? [];
            const reviews = raws.map((raw): (typeof product.reviews)[number] => ({
                author: raw.author || raw.userId || 'Аноним',
                title: raw.title,
                text: raw.text,
                rating: this.clamp(
                    Number(raw.rating) || 1,
                    1,
                    4
                ) as (typeof product.reviews)[number]['rating'],
                date: this.toIso(raw.createdAt),
                likesCount: raw.likesCount ?? 0,
                dislikeCount: raw.dislikeCount ?? 0,
            })) as typeof product.reviews;

            const stats: ProductStatsOut | undefined = statsMap.get(product.id);

            type MetaPatch = {
                annotation?: string;
                publisher?: string;
                publisherBrand?: string;
                buyReasons?: string[];
                ageRating?: string;
                publicationYear?: string | number;
                pagesCount?: number;
                discount?: number;
            };
            const meta = metaByProductId.get(product.id) as
                | MetaPatch
                | undefined;

            return {
                ...product,

                annotation: this.emptyStr((product as any).annotation)
                    ? (meta?.annotation ?? '')
                    : (product as any).annotation,

                publisher: this.emptyStr((product as any).publisher)
                    ? (meta?.publisher ?? '')
                    : (product as any).publisher,

                publisherBrand: this.emptyStr((product as any).publisherBrand)
                    ? (meta?.publisherBrand ?? '')
                    : (product as any).publisherBrand,

                buyReasons: this.emptyArr((product as any).buyReasons)
                    ? (meta?.buyReasons ?? [])
                    : (product as any).buyReasons,

                ageRating: this.emptyStr((product as any).ageRating)
                    ? (meta?.ageRating ?? '')
                    : (product as any).ageRating,

                publicationYear: this.emptyStr((product as any).publicationYear)
                    ? (meta?.publicationYear ?? '')
                    : (product as any).publicationYear,

                pagesCount: this.isZeroNum((product as any).pagesCount)
                    ? (meta?.pagesCount ?? 0)
                    : (product as any).pagesCount,

                discount: this.isZeroNum((product as any).discount)
                    ? (meta?.discount ?? 0)
                    : (product as any).discount,

                reviews,
                salesCount: stats?.salesCount ?? 0,
                averageRating: stats?.averageRating ?? 0,
                ratingsCount: stats?.ratingsCount ?? 0,
            };
        });

        return { ...response, items };
    }
}
