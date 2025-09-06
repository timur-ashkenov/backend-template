export type UgcMetaDoc = {
    _id?: import('mongodb').ObjectId;
    productId: string;

    annotation?: string;
    publisher?: string;
    publisherBrand?: string;
    buyReasons?: string[];
    ageRating?: string;
    publicationYear?: string | number;
    pagesCount?: number;
    discount?: number;
};

export type UgcMetaOut = {
    productId: string;
    annotation: string;
    publisher: string;
    publisherBrand: string;
    buyReasons: string[];
    ageRating: string;
    publicationYear: string | number;
    pagesCount: number;
    discount: number;
};
