import type { Db } from 'mongodb';
import type { UgcMetaDoc, UgcMetaOut } from '../../types/UGCMetaTypes';

export class UgcMetaRepo {
    private collection;

    constructor(db: Db) {
        this.collection = db.collection<UgcMetaDoc>('ugcMeta');
    }

    async getByProductIds(
        productIds: string[]
    ): Promise<Map<string, UgcMetaOut>> {
        if (!productIds.length) return new Map();

        const docs = await this.collection
            .find({ productId: { $in: productIds } })
            .toArray();

        const map = new Map<string, UgcMetaOut>();
        for (const document of docs) {
            map.set(document.productId, {
                productId: document.productId,
                annotation: document.annotation ?? '',
                publisher: document.publisher ?? '',
                publisherBrand: document.publisherBrand ?? '',
                buyReasons: document.buyReasons ?? [],
                ageRating: document.ageRating ?? '',
                publicationYear: document.publicationYear ?? '',
                pagesCount: document.pagesCount ?? 0,
                discount: document.discount ?? 0,
            });
        }

        return map;
    }
}
