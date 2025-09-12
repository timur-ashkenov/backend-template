import type { IReviewDoc, IReviewOut } from '../../types/UGCTypes';
import { normalizeDate } from '../dateTimeAndMath';
import { restrictNumberToRange } from '../numbers';
import {
    PRODUCT_RATING_MIN,
    PRODUCT_RATING_MAX,
    ANONYMOUS_AUTHOR_FALLBACK,
    DEFAULT_NUMERIC_VALUE
} from '../constants';

export function mapReviewDocToOut(doc: IReviewDoc): IReviewOut {
    const id = String(doc._id);

    const author = doc.author ?? doc.userId ?? ANONYMOUS_AUTHOR_FALLBACK;

    const text = doc.text ?? '';

    const numericRating =
        typeof doc.rating === 'number' && Number.isFinite(doc.rating)
            ? doc.rating
            : PRODUCT_RATING_MIN;

    const rating = restrictNumberToRange(
        numericRating,
        PRODUCT_RATING_MIN,
        PRODUCT_RATING_MAX
    ) as IReviewOut['rating'];

    const createdAt = normalizeDate(doc.createdAt);

    const likesCount = typeof doc.likesCount === 'number' ? doc.likesCount : DEFAULT_NUMERIC_VALUE;

    const dislikeCount =
        typeof doc.dislikeCount === 'number' ? doc.dislikeCount : DEFAULT_NUMERIC_VALUE;

    return {
        id,
        productId: doc.productId,
        userId: doc.userId,
        author,
        title: doc.title,
        text,
        rating,
        createdAt,
        likesCount,
        dislikeCount,
    };
}
