export function extractUuidFromHref(href?: string): string | null {
    if (!href) return null;

    const match = href.match(/[0-9a-fA-F-]{36}/);

    return match ? match[0].toLowerCase() : null;
}
