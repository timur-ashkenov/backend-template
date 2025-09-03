import path from 'path';

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

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RelativePath = string & { __brand: 'RelativePath' };

export function asRelativePath(path: string): RelativePath {
    if (path.startsWith('/')) {
        throw new Error(`Path must be relative (no leading '/'): "${path}"`);
    }
    return path as RelativePath;
}

export enum HttpStatus {
    OK = 200,
    MULTIPLE_CHOICES = 300,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    NETWORK_CONNECT_TIMEOUT_ERROR = 599,
}
