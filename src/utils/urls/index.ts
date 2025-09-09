export const safeGetHostname = (urlLike: string): string | null => {
    try {
        return new URL(urlLike).hostname.toLowerCase();
    } catch {
        return null;
    }
};
