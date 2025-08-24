# Интеграция с «МойСклад»

## Что делает
- Бэкенд ходит в `/entity/assortment` МоегоСклада и возвращает нормализованные `MarketProduct`.
- Обрабатываются авторизация (Bearer/Basic), ретраи 429/5xx, таймауты, rate-лимиты.
- Эндпоинт: `GET /api/market/products`.

## Переменные окружения
```env
MS_BASE_URL=https://api.moysklad.ru/api/remap/1.2
# Один из вариантов авторизации:
MS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# или
# MS_USER=login
# MS_PASS=password

# Необязательно:
MS_TIMEOUT_MS=10000
MS_MAX_RETRIES=1

## Эндпоинт
GET /api/market/products?limit=&offset=&search=&includeImages=&onlyActive=
limit — размер страницы. Если includeImages=true и limit > 100, ограничим до 100.
offset — смещение (пагинация).
search — строка поиска.
includeImages — true/false, подгружать изображения (expand=images у МС).
onlyActive — по умолчанию true (исключаем архивные). Передай false, чтобы вернуть все.

#Пример ответа
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
