import { MarketProduct } from "../IntegrationTypes";

export class MoySkladMapper {
  public static toMarketProduct(row: any): MarketProduct {
    const id = String(row?.id ?? "");
    const name = String(row?.name ?? "");

    const code =
      row?.code != null && row.code !== "" ? String(row.code) : undefined;

    const article =
      row?.article != null && row.article !== "" ? String(row.article) : undefined;

    const barcodes = this.pickBarcodes(row);
    const price = this.extractPrice(row);
    const stock = this.num(row?.stock);
    const reserve = this.num(row?.reserve);
    const imageUrls = this.extractImages(row);
    const archived = Boolean(row?.archived);

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
    };
  }

  private static pickBarcodes(row: any): string[] {
    const out: string[] = [];

    // 1) массив barcodes
    if (Array.isArray(row?.barcodes)) {
      for (const barcode of row.barcodes) {
        if (!barcode) continue;

        if (barcode.ean13) out.push(String(barcode.ean13));

        if (barcode.gtin) out.push(String(barcode.gtin));

        if (barcode.ean8) out.push(String(barcode.ean8));

        if (barcode.code128) out.push(String(barcode.code128));

        if (!barcode.ean13 && !barcode.gtin && !barcode.ean8 && !barcode.code128 && barcode.value) {
          out.push(String(barcode.value));
        }
      }
    }

    if (row?.ean13) out.push(String(row.ean13));

    if (row?.gtin) out.push(String(row.gtin));

    if (row?.ean8) out.push(String(row.ean8));

    if (row?.code128) out.push(String(row.code128));

    return Array.from(
      new Set(out.map(url => String(url).trim()).filter(url => url.length > 0))
    );
  }

  private static extractPrice(row: any): number | null {
    const raw = row?.salePrices?.[0]?.value;

    const value = Number(raw);

    if (!Number.isFinite(value) || value <= 0) return null;

    return Math.round(value) / 100; 
  }

  private static extractImages(row: any): string[] {
    const out: string[] = [];

    const imageRows = row?.images?.rows;

    if (Array.isArray(imageRows)) {
      for (const imageRow of imageRows) {
        const imageUrl = imageRow?.meta?.downloadHref || imageRow?.meta?.href;

        if (imageUrl) out.push(String(imageUrl));
      }
    }
    const singleUrl = row?.image?.meta?.downloadHref || row?.image?.meta?.href;

    if (singleUrl) out.push(String(singleUrl));

    return Array.from(
      new Set(out.map(value => String(value).trim()).filter(value => value.length > 0))
    );
  }


  private static num(value: any): number | null {
    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : null;
  }
}
