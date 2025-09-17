import { IProduct } from "../../domains/client";

export interface IClientConfig {
    baseURL: string;
    token?: string;
    basic?: { user: string; pass: string };
    timeoutMs?: number;
    maxRetries?: number;
}

export type THttpHeaders = Record<string, string>;

export interface IHttpResponse<T = unknown> {
    status: number;
    headers: THttpHeaders;
    data: T;
    statusText?: string;
}

export interface IListParams {
    limit?: number;
    offset?: number;
    search?: string;
    includeImages?: boolean;
    onlyActive?: boolean;
}

export type TMarketProduct = {
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

export type TAssortmentMeta = { size: number; offset: number; limit: number };

export type TRateInfo = { limit: number; remaining: number; retryAfter: number };

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type TRelativePath = string & { __brand: 'RelativePath' };

export function asRelativePath(path: string): TRelativePath {
    if (path.startsWith('/')) {
        throw new Error(`Path must be relative (no leading '/'): "${path}"`);
    }
    return path as TRelativePath;
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

export type TRequestArgs = {
    url: string;
    method: THttpMethod;
    headers?: THttpHeaders;
    body?: BodyInit | null;
    timeoutMs?: number;
    signal?: AbortSignal;
};

export interface IMoySkladImageLink {
    href?: string;
    downloadHref?: string;
}

export interface IMoySkladImageMeta {
    href?: string;
    downloadHref?: string;
    [key: string]: unknown;
}

export interface IMoySkladImage {
    meta?: IMoySkladImageMeta;
    miniature?: IMoySkladImageLink;
    tiny?: IMoySkladImageLink;
    small?: IMoySkladImageLink;
    medium?: IMoySkladImageLink;
    big?: IMoySkladImageLink;
    href?: string;
    [key: string]: unknown;
}

export interface IMoySkladImageCollection {
    rows?: IMoySkladImage[];
    meta?: { href?: string; size?: number; [key: string]: unknown };
}

export interface IMoySkladRowWithImages {
    images?: IMoySkladImageCollection;
    product?: {
        images?: IMoySkladImageCollection;
        image?: IMoySkladImage | string | null;
        [key: string]: unknown;
    } | null;
    image?: IMoySkladImage | string | null;
    [key: string]: unknown;
}

export type TMoySkladImageLike = IMoySkladImage | string | null | undefined;

export interface IAssortmentRawResult {
    rows: any[];
    nextOffset?: number;
    rate: TRateInfo;
}

export interface IAssortmentRow {
    id?: string;
    meta?: { href?: string; type?: string };
    images?: {
        rows?: IMoySkladImage[];
        meta?: { href?: string; size?: number };
    };
    product?: {
        id?: string;
        meta?: { href?: string };
        images?: {
            rows?: IMoySkladImage[];
            meta?: { href?: string; size?: number };
        };
    };
    [key: string]: unknown;
}

export type TEnrichJob =
    | { kind: 'self-collection'; row: IAssortmentRow; collectionHref: string }
    | { kind: 'parent-product'; row: IAssortmentRow; productId: string };

export interface IMoySkladMediaServiceOptions {
    moyskladBaseUrl?: string;
    allowMiniatureProxy?: boolean;
}

export interface IMoySkladSalePrice {
    value: number | string | null;
    currency?: { meta?: unknown };
}

export interface IMoySkladRowWithPrices {
    salePrices?: IMoySkladSalePrice[];
}

export interface IFetchAssortmentResult {
    rows: any[];
    responseMeta: any;
    headers: THttpHeaders;
}

export interface IMarketProductsResult {
    items: IProduct[];
    nextOffset?: number;
    rate: TRateInfo;
}
