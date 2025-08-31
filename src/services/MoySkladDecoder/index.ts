import type { IClientProduct } from '../../domains/client';

class MoySkaldDecoder {
    public static decodeProductsList = (
        encodingList: any
    ): IClientProduct[] => {
        const decodingList: IClientProduct[] = [];

        encodingList.forEach((encodingProduct: any) => {
            const decodedProduct: IClientProduct = {
                id: encodingProduct._id,
                title: encodingProduct.title,
                author: encodingProduct.author,
                price: encodingProduct.price,
                description: encodingProduct.description,
                stock: encodingProduct.stock,
                createdAt: encodingProduct.createdAt,
            };

            decodingList.push(decodedProduct);
        });

        return decodingList;
    };
}

export default MoySkaldDecoder;
