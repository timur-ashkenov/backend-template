export function restrictNumberToRange(
    numeric: number,
    min: number,
    max: number
) {
    return Math.min(max, Math.max(min, numeric));
}

export function convertDateToIsoString(date: Date | string) {
    return date instanceof Date
        ? date.toISOString()
        : new Date(date).toISOString();
}

export function normalizeDate(
    input: Date | string | number | null | undefined
): Date {
    if (input instanceof Date) return input;

    const date = new Date(input ?? Date.now());

    return Number.isFinite(date.getTime()) ? date : new Date();
}
