export function toNumberOrNull(value: unknown): number | null {
    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : null;
}

export const toNonNegativeNumber = (value: unknown): number | null => {
    const numeric = Number(value);

    return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};
