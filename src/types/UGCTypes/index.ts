export type Ratings = 1 | 2 | 3 | 4;

export interface ReviewDoc {
  _id: import("mongodb").ObjectId;
  productId: string;
  userId: string;          
  author: string;          
  title?: string;
  text: string;
  rating: Ratings;         
  createdAt: Date;
  likesCount: number;
  dislikeCount: number;
}

export interface ProductStatsDoc {
  _id?: import("mongodb").ObjectId; 
  productId: string;               
  salesCount: number;
  ratingsCount: number;
  averageRating: number;
  reviewsCount?: number;
}

export interface ReviewOut {
  id: string;               
  productId: string;
  userId: string;
  author: string;
  title?: string;
  text: string;
  rating: Ratings;
  createdAt: Date;          
  likesCount: number;
  dislikeCount: number;
}

export interface ProductStatsOut {
  productId: string;
  salesCount: number;
  ratingsCount: number;
  averageRating: number;
}
