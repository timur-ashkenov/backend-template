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
    statusText?: string;
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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

export type RequestArgs = {
    url: string;
    method: HttpMethod;
    headers?: HttpHeaders;
    body?: BodyInit | null;
    timeoutMs?: number;
    signal?: AbortSignal;
};

export interface MoySkladImageLink {
    href?: string;
    downloadHref?: string;
}

export interface MoySkladImageMeta {
    href?: string;
    downloadHref?: string;
    [key: string]: unknown;
}

export interface MoySkladImage {
    meta?: MoySkladImageMeta;
    miniature?: MoySkladImageLink;
    tiny?: MoySkladImageLink;
    small?: MoySkladImageLink;
    medium?: MoySkladImageLink;
    big?: MoySkladImageLink;
    href?: string;
    [key: string]: unknown;
}

export interface MoySkladImageCollection {
    rows?: MoySkladImage[];
    meta?: { href?: string; size?: number; [key: string]: unknown };
}

export interface MoySkladRowWithImages {
    images?: MoySkladImageCollection;
    product?: {
        images?: MoySkladImageCollection;
        image?: MoySkladImage | string | null;
        [key: string]: unknown;
    } | null;
    image?: MoySkladImage | string | null;
    [key: string]: unknown;
}

export type MoySkladImageLike = MoySkladImage | string | null | undefined;

export interface AssortmentRawResult {
    rows: any[];
    nextOffset?: number;
    rate: RateInfo;
}

export interface AssortmentRow {
    id?: string;
    meta?: { href?: string; type?: string };
    images?: {
        rows?: MoySkladImage[];
        meta?: { href?: string; size?: number };
    };
    product?: {
        id?: string;
        meta?: { href?: string };
        images?: {
            rows?: MoySkladImage[];
            meta?: { href?: string; size?: number };
        };
    };
    [key: string]: unknown;
}

export type EnrichJob =
    | { kind: 'self-collection'; row: AssortmentRow; collectionHref: string }
    | { kind: 'parent-product'; row: AssortmentRow; productId: string };
