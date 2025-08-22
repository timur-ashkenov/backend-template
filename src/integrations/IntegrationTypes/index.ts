export type MarketProduct = {
  id: string;
  name: string;
  code?: string;
  article?: string;
  barcodes: string[];
  price?: number | null;
  stock?: number | null;
  reserve?: number | null;
  imageUrls: string[];
  archived: boolean;
};