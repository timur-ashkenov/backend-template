import type { IListParams } from '../MoySkladApi/MoySkladTypes';
import { ProductFeedService } from '../services/ProductFeedService';
import { Request, Response } from 'express';


const parseNumberOrUndefined = (value: unknown): number | undefined => {
    if (value === undefined) return undefined;

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) return undefined;

    return numeric;
};

const parseBooleanOrUndefined = (value: unknown): boolean | undefined => {
    if (value === undefined) return undefined;

    if (value === true || value === 'true') return true;

    if (value === false || value === 'false') return false;

    return undefined;
};

const getStringOrUndefined = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();

    if (trimmed === '') return undefined;

    return trimmed;
};

export class MoySkladMarketController {
    constructor(private readonly productFeed: ProductFeedService) {}

    public fetchMarketProducts = async (
        request: Request,
        response: Response
    ): Promise<void> => {
        const limit = parseNumberOrUndefined(request.query.limit);

        const offset = parseNumberOrUndefined(request.query.offset);

        const includeImages = parseBooleanOrUndefined(request.query.includeImages);

        const onlyActive = parseBooleanOrUndefined(request.query.onlyActive);

        const reviewsLimit = parseNumberOrUndefined(request.query.reviewsLimit);

        const search = getStringOrUndefined(request.query.search);

        if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
            response.status(400).json({ error: 'limit must be an integer ≥ 1' });

            return;
        }

        if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
            response.status(400).json({ error: 'offset must be an integer ≥ 0' });

            return;
        }
        
        if (
            reviewsLimit !== undefined &&
            (!Number.isInteger(reviewsLimit) || reviewsLimit < 1)
        ) {
            response.status(400).json({
                error: 'reviewsLimit must be an integer ≥ 1',
            });

            return;
        }

        const effectiveLimit = limit ?? 50;

        const effectiveOffset = offset ?? 0;

        const effectiveIncludeImages = includeImages ?? true;

        const params: IListParams & { reviewsLimit?: number } = {
            limit: effectiveLimit,
            offset: effectiveOffset,
            search,
            includeImages: effectiveIncludeImages,
            onlyActive,
            reviewsLimit,
        };

        const data = await this.productFeed.listProductsWithUgc(params);

        response.json(data);
    };
}
