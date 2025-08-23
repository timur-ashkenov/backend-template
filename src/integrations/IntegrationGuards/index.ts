import { AssortmentMeta } from '../IntegrationTypes';

export class MoySkladGuards {
    public static isAssortmentMeta(
        metaLike: unknown
    ): metaLike is AssortmentMeta {
        return (
            !!metaLike &&
            Number.isFinite((metaLike as any).size) &&
            Number.isFinite((metaLike as any).offset) &&
            Number.isFinite((metaLike as any).limit)
        );
    }
}
