import { toNumberOrNull } from '../../utils/numbers';
import { MarketProduct, MoySkladRowWithImages } from '../MoySkladTypes';
import { MoySkladMediaService } from '../MoySkladServices/MediaService';

const mediaService = new MoySkladMediaService({
    allowMiniatureProxy: false,
});

export class MoySkladMapper {
    public static getMarketProduct(row: any): MarketProduct {
        const id = String(row?.id ?? '');

        const name = String(row?.name ?? '');

        const code = row?.code != null && row.code !== '' ? String(row.code) : undefined;

        const article = row?.article != null && row.article !== '' ? String(row.article) : undefined;

        const barcodes = mediaService.collectBarcodes(row);

        const price = mediaService.extractSalePriceRub(row);

        const stock = toNumberOrNull(row?.stock);

        const reserve = toNumberOrNull(row?.reserve);

        const imageUrls = mediaService.extractImageUrls(row as MoySkladRowWithImages);

        const archived = Boolean(row?.archived);
        
        const weight = toNumberOrNull(row?.weight ?? row?.product?.weight);

        return {
            id,
            name,
            code,
            article,
            barcodes,
            price,
            stock,
            reserve,
            imageUrls,
            archived,
        } as MarketProduct;
    }
}
