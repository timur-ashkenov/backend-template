# Интеграция с «МойСклад»

## Что делает
- The backend queries /entity/assortment from MoySklad and returns normalized MarketProduct objects.
- Handles authorization (Bearer/Basic), retries on 429/5xx, timeouts, and rate limits.
- Endpoint: GET /market/products.

## Environment variables
```env
MS_BASE_URL=https://api.moysklad.ru/api/remap/1.2
# One of the authorization options:
MS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# or
# MS_USER=login
# MS_PASS=password

# Optional:
MS_TIMEOUT_MS=10000
MS_MAX_RETRIES=1

## Endpoint
GET /api/market/products?limit=&offset=&search=&includeImages=&onlyActive=
limit — page size. If includeImages=true and limit > 100, it will be capped at 100.
offset — pagination offset.
search — search query string.
includeImages — true/false, whether to load images (expand=images in MoySklad).
onlyActive — defaults to true (exclude archived items). Pass false to return all.

#Example response
{
  "items": [
    {
      "id": "bc6a6389-8065-11f0-0a80-03bc00460ea3",
      "name": "Demo Coffee 250g",
      "code": "COF250",
      "article": "C-250",
      "barcodes": ["SKU-COFFEE-250"],
      "price": null,
      "stock": 0,
      "reserve": 0,
      "imageUrls": [],
      "archived": false
    }
  ],
  "nextOffset": 50,
  "rate": { "limit": 45, "remaining": 44, "retryAfter": 0 }
}
