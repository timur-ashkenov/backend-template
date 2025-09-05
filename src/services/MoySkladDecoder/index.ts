import type { IProduct } from '../../domains/client';
import { MoySkladMapper } from '../../MoySkladApi/MoySkladMapper';
import { toNumberOrNull } from '../../utils/numbers';
import { readMsAttr } from '../../utils/readMs';
import { MoySkladProductAttributes, COVER_TYPE_MAP } from '../../utils/constants';

export class MoySkladDecoder {
    public static decodeProductsList = (rows: any[]): IProduct[] => {
        return rows.map((row) => {
            const MarketProduct = MoySkladMapper.getMarketProduct(row);

            const pagesCount =
                toNumberOrNull(readMsAttr(row, MoySkladProductAttributes.PAGES_COUNT)) ?? 0;

            const weight =
                toNumberOrNull(row.weight) ??
                toNumberOrNull(row.product?.weight) ??
                0;

            const coverTypeRaw = String(readMsAttr(row, MoySkladProductAttributes.COVER_TYPE) ?? '')
                .trim()
                .toUpperCase();

            const coverType = COVER_TYPE_MAP[coverTypeRaw] ?? 'PAPERBACK';

            const annotation = String(readMsAttr(row, MoySkladProductAttributes.ANNOTATION) ?? '');

            const publisher = String(readMsAttr(row, MoySkladProductAttributes.PUBLISHER) ?? '');

            const publisherBrand = String(
                readMsAttr(row, MoySkladProductAttributes.PUBLISHER_BRAND) ?? ''
            );

            const ageRating = String(readMsAttr(row, MoySkladProductAttributes.AGE_RATING) ?? '');

            const publicationYear = String(
                readMsAttr(row, MoySkladProductAttributes.PUBLICATION_YEAR) ?? ''
            );

            const discount =
                toNumberOrNull(readMsAttr(row, MoySkladProductAttributes.DISCOUNT)) ?? 0;

            const buyRaw = readMsAttr(row, MoySkladProductAttributes.BUY_REASONS);

            const buyReasons = Array.isArray(buyRaw)
                ? buyRaw.map(String).filter(Boolean)
                : String(buyRaw ?? '')
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);

            const ISBN = MarketProduct.article ?? MarketProduct.code ?? '';

            const availableRaw = readMsAttr(row, MoySkladProductAttributes.IS_AVAILABLE);

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
