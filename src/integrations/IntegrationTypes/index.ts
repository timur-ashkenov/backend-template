export interface ClientConfig {
    baseURL: string;
    token?: string;
    basic?: { user: string; pass: string };
    timeoutMs?: number;
    maxRetries?: number;
}

export type HttpHeaders = Record<string, string>;

export interface HttpResponse<T = unknown> {
    status: number;
    headers: HttpHeaders;
    data: T;
}

export interface ListParams {
    limit?: number;
    offset?: number;
    search?: string;
    includeImages?: boolean;
    onlyActive?: boolean;
}

export type MarketProduct = {
    id: string;
    name: string;
    code?: string;
    article?: string;
    barcodes: string[];
    price?: number | null;
    stock?: number | null;
    reserve?: number | null;
    imageUrls: string[];
    archived: boolean;
};

export type AssortmentMeta = { size: number; offset: number; limit: number };

export type RateInfo = { limit: number; remaining: number; retryAfter: number };
