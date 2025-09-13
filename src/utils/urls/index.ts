export function safeParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export const safeGetHostname = (urlLike: string): string | null => {
    try {
        return new URL(urlLike).hostname.toLowerCase();
    } catch {
        return null;
    }
};