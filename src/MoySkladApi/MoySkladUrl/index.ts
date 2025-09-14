export class MoySkladUrl {
    public static getBaseUrl(): string {
        const fallback = 'https://api.moysklad.ru/api/remap/1.2';
        
        return (process.env.MOYSKLAD_BASE_URL || fallback).replace(/\/+$/, '');
    }

    public static buildAbsoluteUrl(path: string): string {
        const base = this.getBaseUrl();

        return `${base}/${path.replace(/^\/+/, '')}`;
    }

    public static getHostname(): string {
        try {
            return new URL(this.getBaseUrl() + '/').hostname.toLowerCase();
        } catch {
            return 'api.moysklad.ru';
        }
    }
}
