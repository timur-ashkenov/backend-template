import { Request, Response } from 'express';
import { MoySkladClient } from '../MoySkladApi/MoySkladClient';
import { MoySkladService } from '../MoySkladApi/MoySkladServices/MoySkladService';

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

const client = new MoySkladClient({
  baseURL: process.env.MOYSKLAD_BASE_URL!,
  token: process.env.MOYSKLAD_TOKEN,
  basic:
    process.env.MS_USER && process.env.MS_PASS
      ? { user: process.env.MS_USER, pass: process.env.MS_PASS }
      : undefined,
  timeoutMs: Number(process.env.MOYSKLAD_TIMEOUT_MS ?? 10000),
  maxRetries: Number(process.env.MS_MAX_RETRIES ?? 1),
});

const service = new MoySkladService(client);

export class MoySkladMarketController {
  static async fetchMarketProducts(request: Request, response: Response) {
    const limit = toNumberOrUndefined(request.query.limit) ?? 50;

    const offset = toNumberOrUndefined(request.query.offset) ?? 0;

    const search =
      typeof request.query.search === 'string'
        ? request.query.search
        : undefined;

    const includeImages = toBooleanOrUndefined(request.query.includeImages);

    const onlyActive = toBooleanOrUndefined(request.query.onlyActive);

    const { items, nextOffset, rate } = await service.listMarketProducts({
      limit,
      offset,
      search,
      includeImages,
      onlyActive,
    });

    return response.json({ items, nextOffset, rate });
  }
  
}
