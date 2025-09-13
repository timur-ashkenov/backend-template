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
