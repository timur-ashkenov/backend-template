import type { IProduct } from '../../domains/client';
import { MoySkladMapper } from '../../MoySkladApi/MoySkladMapper';
import { toNumberOrNull } from '../../utils/numbers';
import { readMsAttr } from '../../utils/readMs';
import { ATTR, COVER_TYPE_MAP } from '../../utils/constants';

export class MoySkladDecoder {
    public static decodeProductsList = (rows: any[]): IProduct[] => {
        return rows.map((row) => {
            const MarketProduct = MoySkladMapper.toMarketProduct(row);

            const pagesCount =
                toNumberOrNull(readMsAttr(row, ATTR.PAGES_COUNT)) ?? 0;

            const weight =
                toNumberOrNull(row.weight) ??
                toNumberOrNull(row.product?.weight) ??
                0;

            const coverTypeRaw = String(readMsAttr(row, ATTR.COVER_TYPE) ?? '')
                .trim()
                .toUpperCase();

            const coverType = COVER_TYPE_MAP[coverTypeRaw] ?? 'PAPERBACK';

            const annotation = String(readMsAttr(row, ATTR.ANNOTATION) ?? '');

            const publisher = String(readMsAttr(row, ATTR.PUBLISHER) ?? '');

            const publisherBrand = String(
                readMsAttr(row, ATTR.PUBLISHER_BRAND) ?? ''
            );

            const ageRating = String(readMsAttr(row, ATTR.AGE_RATING) ?? '');

            const publicationYear = String(
                readMsAttr(row, ATTR.PUBLICATION_YEAR) ?? ''
            );

            const discount =
                toNumberOrNull(readMsAttr(row, ATTR.DISCOUNT)) ?? 0;

            const buyRaw = readMsAttr(row, ATTR.BUY_REASONS);

            const buyReasons = Array.isArray(buyRaw)
                ? buyRaw.map(String).filter(Boolean)
                : String(buyRaw ?? '')
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);

            const ISBN = MarketProduct.article ?? MarketProduct.code ?? '';

            const availableRaw = readMsAttr(row, ATTR.IS_AVAILABLE);

            const isAvailable =
                typeof availableRaw === 'boolean'
                    ? availableRaw
                    : (MarketProduct.stock ?? 0) > 0;

            const product: IProduct = {
                id: MarketProduct.id,
                title: MarketProduct.name,
                price: MarketProduct.price ?? 0,
                discount,
                isAvailable,
                coverType: coverType as IProduct['coverType'],
                pagesCount,
                weight,
                annotation,
                publisher,
                publisherBrand,
                buyReasons,
                ageRating,
                publicationYear,
                ISBN,
                reviews: [],
                salesCount: 0,
                averageRating: 0,
                ratingsCount: 0,
                imagesUrls: MarketProduct.imageUrls,
            };

            return product;
        });
    };
}

export default MoySkladDecoder;
