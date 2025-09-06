import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import type {
  ReviewDoc,
  ProductStatsDoc,
  ReviewOut,
  ProductStatsOut,
} from "../../types/UGCTypes";

export class UgcRepo {
  private statsColl;
  private reviewsColl;

  constructor(db: Db) {
    this.statsColl = db.collection<ProductStatsDoc>("productStats");
    this.reviewsColl = db.collection<ReviewDoc>("reviews");
  }

  async ensureProductStats(productIds: string[]): Promise<void> {
    if (!productIds.length) return;

    const ops = productIds.map((pid) => ({
      updateOne: {
        filter: { productId: pid },
        update: {
          $setOnInsert: {
            productId: pid,
            salesCount: 0,
            ratingsCount: 0,
            averageRating: 0,
            reviewsCount: 0,
          },
        },
        upsert: true,
      },
    }));

    await this.statsColl.bulkWrite(ops, { ordered: false });
  }

  async getStatsByProductIds(productIds: string[]): Promise<Map<string, ProductStatsOut>> {
    if (!productIds.length) return new Map();

    const docs = await this.statsColl
      .find({ productId: { $in: productIds } })
      .project<ProductStatsDoc>({
        _id: 0,
        productId: 1,
        salesCount: 1,
        ratingsCount: 1,
        averageRating: 1,
      })
      .toArray();

    const out = new Map<string, ProductStatsOut>();
    for (const document of docs) {
      out.set(document.productId, {
        productId: document.productId,
        salesCount: document.salesCount ?? 0,
        ratingsCount: document.ratingsCount ?? 0,
        averageRating: document.averageRating ?? 0,
      });
    }
    return out;
  }

  async getLatestReviewsByProductIds(
    productIds: string[],
    limitPerProduct = 3
  ): Promise<Map<string, ReviewOut[]>> {
    if (!productIds.length) return new Map();

    const pipeline = [
      { $match: { productId: { $in: productIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$productId",
          reviews: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          reviews: { $slice: ["$reviews", limitPerProduct] },
        },
      },
    ] as const;

    const rows = await this.reviewsColl
      .aggregate<{ productId: string; reviews: ReviewDoc[] }>(pipeline as any)
      .toArray();

    const map = new Map<string, ReviewOut[]>();
    for (const row of rows) {
      const list: ReviewOut[] = row.reviews.map((doc) => ({
        id: String(doc._id),
        productId: doc.productId,
        userId: doc.userId,
        author: doc.author ?? doc.userId ?? "Аноним",
        title: doc.title,
        text: doc.text ?? "",
        rating:
          typeof doc.rating === "number" && Number.isFinite(doc.rating)
            ? (Math.min(4, Math.max(1, doc.rating)) as ReviewOut["rating"])
            : 1,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt ?? Date.now()),
        likesCount: typeof doc.likesCount === "number" ? doc.likesCount : 0,
        dislikeCount: typeof doc.dislikeCount === "number" ? doc.dislikeCount : 0,
      }));
      map.set(row.productId, list);
    }
    return map;
  }
}
