import { toBooleanOrUndefined, toNumberOrUndefined } from '../utils/query';
import { ProductFeedService } from '../services/ProductFeedService';
import { IListParams } from '../MoySkladApi/MoySkladTypes';
import { Request, Response } from 'express';
import {
    DEFAULT_LIMIT,
    DEFAULT_INCLUDE_IMAGES,
    DEFAULT_OFFSET,
} from '../utils/constants';

export class MoySkladMarketController {
    constructor(private readonly productFeed: ProductFeedService) {}

    fetchMarketProducts = async (request: Request, response: Response) => {
        const params: IListParams & { reviewsLimit?: number } = {
            limit: toNumberOrUndefined(request.query.limit) ?? DEFAULT_LIMIT,
            offset: toNumberOrUndefined(request.query.offset) ?? DEFAULT_OFFSET,
            search:
                typeof request.query.search === 'string'
                    ? request.query.search
                    : undefined,
            includeImages:
                toBooleanOrUndefined(request.query.includeImages) ??
                DEFAULT_INCLUDE_IMAGES,
            onlyActive: toBooleanOrUndefined(request.query.onlyActive),
            reviewsLimit: toNumberOrUndefined(request.query.reviewsLimit),
        };

        const data = await this.productFeed.listProductsWithUgc(params);

        response.json(data);
    };
}
