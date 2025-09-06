import { Request, Response } from 'express';
import { ProductFeedService } from '../services/ProductFeedService';
import { ListParams } from '../MoySkladApi/MoySkladTypes';

const toNumberOrUndefined = (value: unknown): number | undefined => {
    if (value === undefined) return undefined;

    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : undefined;
};

const toBooleanOrUndefined = (value: unknown): boolean | undefined => {
    if (value === undefined) return undefined;

    if (value === 'true' || value === true) return true;

    if (value === 'false' || value === false) return false;

    return undefined;
};

export class MoySkladMarketController {
    constructor(private readonly feed: ProductFeedService) {}

    fetchMarketProducts = async (request: Request, response: Response) => {
        const params: ListParams & { reviewsLimit?: number } = {
            limit: toNumberOrUndefined(request.query.limit) ?? 50,
            offset: toNumberOrUndefined(request.query.offset) ?? 0,
            search:
                typeof request.query.search === 'string'
                    ? request.query.search
                    : undefined,
            includeImages:
                toBooleanOrUndefined(request.query.includeImages) ?? true,
            onlyActive: toBooleanOrUndefined(request.query.onlyActive),
            reviewsLimit: toNumberOrUndefined(request.query.reviewsLimit),
        };

        const data = await this.feed.listProductsWithUgc(params);

        response.json(data);
    };
}
