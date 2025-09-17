import { IListParams } from '../../MoySkladApi/MoySkladTypes';
import type { ParsedQs } from 'qs';

export type TQueryValue =
    | string
    | number
    | boolean
    | ParsedQs
    | (string | ParsedQs)[]
    | readonly (string | ParsedQs)[]
    | undefined;

export const toNumberOrUndefined = (value: TQueryValue): number | undefined => {
    if (value === undefined) return undefined;

    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : undefined;
};

export const toBooleanOrUndefined = (
    value: TQueryValue
): boolean | undefined => {
    if (value === undefined) return undefined;

    if (value === 'true' || value === true) return true;

    if (value === 'false' || value === false) return false;

    return undefined;
};

export function buildAssortmentQuery(params: IListParams): Record<string, any> {
    const requestLimit = params.limit ?? 50;
    const effectiveLimit = params.includeImages
        ? Math.min(100, requestLimit)
        : requestLimit;
    const offset = params.offset ?? 0;

    const query: Record<string, any> = {
        limit: effectiveLimit,
        offset,
        expand: params.includeImages ? 'images,product' : 'product',
    };

    if (params.search) {
        query.search = params.search;
    }

    if (params.onlyActive !== false) {
        query.filter = 'archived=false';
    }

    return query;
}

