import { Request, Response } from "express";
import { MoySkladClient } from "../integrations/IntegrationClient";
import { MoySkladService } from "../integrations/IntegrationService";

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
    const { limit, offset, search, includeImages, onlyActive } =
      request.query as Record<string, string | undefined>;

    const result = await service.listMarketProducts({
      limit:  limit  !== undefined ? Number(limit)  : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      search: typeof search === "string" ? search : undefined,
      includeImages:
        includeImages === "true" ? true :
        includeImages === "false" ? false : undefined,
      onlyActive:
        onlyActive === "true" ? true :
        onlyActive === "false" ? false : undefined,
    });

    return response.json(result);
  }
}
