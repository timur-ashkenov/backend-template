# Integration with MoySklad

## Fucntionality of API
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

##Quert parametrs
Name: limit;	Type: int;	Default: 50;	Description: Page size. If includeImages=true and limit > 100, it will be capped at 100 (MoySklad limitation).

Name: offset;	Type: int;  Default: 0;	Description: Pagination offset.
Name: search; Type:	string; Default: —;	Description: Full-text search within MoySklad assortment (e.g., by name or article).
Name: includeImages; Type: boolean;	Default: false	Description: Whether to load images (expand=images in MoySklad). May affect performance.
Name: onlyActive	Type: boolean;	Default: true;	Description: By default archived products are excluded. Pass false to include all.

#Example response
{
            "id": "5f5d292c-8767-11f0-0a80-16b10002c83d",
            "title": "Завтра, завтра",
            "price": 690,
            "discount": 21,
            "isAvailable": true,
            "coverType": "PAPERBACK",
            "pagesCount": 422,
            "weight": 0.344,
            "annotation": "Залитое солнцем побережье Саленто...",
            "publisher": "Альпина Паблишер",
            "publisherBrand": "Бель Летр",
            "buyReasons": [
                "Новый роман от автора международного бестселлера «Почтальонша».; История мужества, выбора и сожалений...; Атмосфера Италии 1950–1960-х"
            ],
            "ageRating": "16+",
            "publicationYear": "2023",
            "ISBN": "978-5-00167-101-1",
            "reviews": [],
            "salesCount": 0,
            "averageRating": 0,
            "ratingsCount": 0,
            "imagesUrls": [
                "https://api.moysklad.ru/api/remap/1.2/download/6f12e2e6-b729-4b1f-bc00-be6f6f5f8bd5?miniature=true",
                "https://api.moysklad.ru/api/remap/1.2/download/aaf4e04d-6196-4633-9741-176262939b0b?miniature=true",
                "https://api.moysklad.ru/api/remap/1.2/download/920a962a-8c6c-426b-a9ed-2d28aa68ef59?miniature=true"
            ]
        },

