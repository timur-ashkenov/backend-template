import { TAssortmentMeta } from '../MoySkladTypes';

export class TypeGuardsService {
    public static isAssortmentMeta(
        metaLike: unknown
    ): metaLike is TAssortmentMeta {
        return (
            !!metaLike &&
            Number.isFinite((metaLike as any).size) &&
            Number.isFinite((metaLike as any).offset) &&
            Number.isFinite((metaLike as any).limit)
        );
    }
}
