import { IProductBook, ProductBook } from "../../models/Product";

export class ProductService {
    public static async createProduct(data: IProductBook) {
        try {
            const document = await ProductBook.create(data);

            return document;
        } catch (error) {
            console.error('Failed to create doucument', error);

            throw error;
        }
    }

    public static async getListOfProducts() {
        try {
            const list = await ProductBook.find({});

            return list;
        } catch (error) {
            console.error('Failed to find a list of products', error);

            throw error;
        }
    }

    public static async getProductById(id: string) {
        try {
            const productByID = await ProductBook.findById(id);

            if (!productByID) {
                throw new Error('Product not found');
            }

            return productByID;
        } catch (error) {
            console.error('Failed to find a product by Id', error);

            throw error;
        }
    }

    public static async updateProduct(id: string, data: Partial<IProductBook>) {
        try {
            const updatedProduct = await ProductBook.findByIdAndUpdate(
                id,
                data,
                {
                    new: true,
                }
            );

            if (!updatedProduct) {
                throw new Error('Product not found');
            }

            return updatedProduct;
        } catch (error) {
            console.error('Failed to update product', error);

            throw error;
        }
    }

    public static async deleteProduct(id: string) {
        try {
            const deletedProduct = await ProductBook.findByIdAndDelete(id);

            if (!deletedProduct) {
                throw new Error('Product not found');
            }

            return deletedProduct;
        } catch (error) {
            console.error('Failed to delete product', error);

            throw error;
        }
    }
}
