export const toNormalizedNonEmptyString = (value: unknown): string | null => {
    const normalized = String(value ?? '').trim();

    return normalized.length > 0 ? normalized : null;
};

export const toUniqueStringList = (values: string[]): string[] => {
    const seen = new Set<string>();

    const result: string[] = [];

    for (const value of values) {
        if (!seen.has(value)) {
            seen.add(value);
            result.push(value);
        }
    }
    return result;
};
