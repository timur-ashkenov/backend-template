import { Request, Response } from 'express';
import { ProductFeedService } from '../services/ProductFeedService';
import { ListParams } from '../MoySkladApi/MoySkladTypes';

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const toBooleanOrUndefined = (value: unknown): boolean | undefined => {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
};

export class MoySkladMarketController {
  constructor(private readonly feed: ProductFeedService) {}

  fetchMarketProducts = async (req: Request, res: Response) => {
    const params: ListParams & { reviewsLimit?: number } = {
      limit: toNumberOrUndefined(req.query.limit) ?? 50,
      offset: toNumberOrUndefined(req.query.offset) ?? 0,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      includeImages: toBooleanOrUndefined(req.query.includeImages),
      onlyActive: toBooleanOrUndefined(req.query.onlyActive),
      reviewsLimit: toNumberOrUndefined(req.query.reviewsLimit),
    };

    const data = await this.feed.listProductsWithUgc(params);
    res.json(data);
  };
}
