export type TRatings = 1 | 2 | 3 | 4;

export interface IReviewDoc {
  _id: import("mongodb").ObjectId;
  productId: string;
  userId: string;          
  author: string;          
  title?: string;
  text: string;
  rating: TRatings;         
  createdAt: Date;
  likesCount: number;
  dislikeCount: number;
}

export interface IProductStatsDoc {
  _id?: import("mongodb").ObjectId; 
  productId: string;               
  salesCount: number;
  ratingsCount: number;
  averageRating: number;
  reviewsCount?: number;
}

export interface IReviewOut {
  id: string;               
  productId: string;
  userId: string;
  author: string;
  title?: string;
  text: string;
  rating: TRatings;
  createdAt: Date;          
  likesCount: number;
  dislikeCount: number;
}

export interface IProductStatsOut {
  productId: string;
  salesCount: number;
  ratingsCount: number;
  averageRating: number;
}
