import { TypeGuardsService } from '../../MoySkladApi/MoySkladGuards';
import type { IListParams } from '../../MoySkladApi/MoySkladTypes';

export function calculateNextOffset(
    responseMeta: any,
    rows: any[],
    params: IListParams
): number | undefined {
    if (TypeGuardsService.isAssortmentMeta(responseMeta)) {
        const { offset, limit, size } = responseMeta;

        if (offset + limit < size) return offset + limit;
    }

    const requestLimit = params.limit ?? 50;
    if (
        !TypeGuardsService.isAssortmentMeta(responseMeta) &&
        rows.length === requestLimit
    ) {
        return (params.offset ?? 0) + requestLimit;
    }

    return undefined;
}
