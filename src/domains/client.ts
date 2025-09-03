export enum BookCoverTypes {
  PAPERBACK = "PAPERBACK",
  HARDCOVER = "HARDCOVER",
  DIGITAL = "DIGITAL",
}

export enum Ratings {
  POOR = 1,
  MEDIUM = 2,
  GOOD = 3,
  EXCELLENT = 4,
}

export interface Review {
  author: string;
  title?: string;          
  text: string;
  rating: Ratings;
  date: string;            
  likesCount: number;
  dislikeCount: number;
}

export interface IProduct {
  id: string;
  title: string;
  price: number;
  discount: number;
  isAvailable: boolean;
  coverType: BookCoverTypes;
  pagesCount: number;
  weight: number;
  annotation: string;
  publisher: string;
  publisherBrand: string;
  buyReasons: string[];
  ageRating: string;
  publicationYear: string;
  ISBN: string;
  reviews: Review[];
  salesCount: number;
  averageRating: number;
  ratingsCount: number;
  imagesUrls: string[];
}
