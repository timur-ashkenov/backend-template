export function toNumberOrNull(value: unknown): number | null {
  const numeric = Number(value);
  
  return Number.isFinite(numeric) ? numeric : null;
}

export function restrictNumberToRange(
  numeric: number,
  min: number,
  max: number
): number {
  return Math.min(max, Math.max(min, numeric));
}

export const toNonNegativeNumber = (value: unknown): number | null => {
    const numeric = Number(value);

    return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};
