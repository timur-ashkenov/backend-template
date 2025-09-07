# 🧩 Product Store — Backend Template 

Backend template for **products**, **email verification via SMTP**, **MoySklad integration**, and **transactions**.  
Built with **Node.js + Express + TypeScript + MongoDB** and documented with **Swagger (OpenAPI)**. Docker Compose is included for local development.

---

## 1) Project Overview

This service provides:

- **Product catalog** from **MoySklad**: fetches assortment, normalizes to a frontend-friendly shape, merges **UGC** (reviews, counters, ratings) from MongoDB, and optionally resolves product **images** via a safe proxy.
- **Email verification (SMTP)**: request and verify a 6‑digit code to authenticate users.
- **Transactions**: create and list purchase-like transactions stored in MongoDB.
- **Operational endpoints**: `/health`, `/api/ping`, `/test` for sanity checks.
- **Swagger UI** at `/docs` (and `/docs.json` for the raw spec).

---

## 2) Technology Stack

- **Node.js** + **TypeScript**
- **Express 5**
- **MongoDB** (native driver via `mongodb` in `DataBaseConnectionService`; indexes created on startup)
- **Swagger (OpenAPI 3.0)** via `swagger-jsdoc` & `swagger-ui-express`
- **nodemailer / SMTP** (email verification flow)
- **axios** (HTTP client for some routes/proxies)
- **dotenv** (env config), **cors**, **bcryptjs** (if needed by auth domain)
- **Docker / docker-compose**

---

## 3) Integration Services

### 3.1 HTTPService
Resilient HTTP wrapper used by the MoySklad client layer:

- `requestWithJson(args)` — wraps `fetch` with:
  - **timeout** via `AbortController` (`timeoutMs`),
  - **merged AbortSignals** (caller + timeout) with `mergeAbortSignals`,
  - header normalization (`toLowercaseHeaders`),
  - safe JSON handling (`safeJson` + `tryParseJson` fallback),
  - unified response `{ status, statusText, headers, data }`.
- `buildQuery`, `buildUrl` — robust querystring and URL builder (arrays supported).
- `pickErrorMessage` — extracts meaningful error messages from upstream payloads.

**Purpose:** consistent HTTP behavior, safer parsing, clean error surfaces.

### 3.2 RetryService
Backoff & retry timing based on upstream headers and status codes:

- Parses MoySklad and standard headers: `x-lognex-retry-timeinterval` (ms), `x-lognex-retry-after` (sec), `retry-after` (sec or HTTP-date).
- `computeBackoffMs(status, headers, attempt)`:
  - For **429/503** → honor upstream hints, then limited linear fallback.
  - Otherwise → exponential backoff with jitter.

**Purpose:** respect MoySklad rate limits and stabilize traffic.

### 3.3 MoySkladService
High-level API for MoySklad assortment & normalized market products:

- **Assortment fetch** with `expand=product` and optionally `expand=images`.
- **Effective limit**: when `includeImages=true`, limit is **clamped to 100** (API/throughput constraint).
- **Image enrichment** (`enrichRowsWithImages`):
  - If a row lacks `images.rows`, try its **own image collection**;
  - Fallback to **parent product**: `entity/product/{id}?expand=images`.
  - Runs concurrently (up to 8 jobs) to balance speed/rate-limits.
- **Rate info extraction** from headers (`limit`, `remaining`, `retryAfter`) and **nextOffset** calculation from `meta` or by page-size heuristic.
- Exported methods:
  - `listAssortmentRaw(params): { rows, nextOffset, rate }`
  - `listMarketProducts(params): { items, nextOffset, rate }` — decodes to `IProduct` via `MoySkladDecoder` (frontend-friendly schema).

**Related components:** `MoySkladClient`, `TypeGuardsService`, `MoySkladDecoder`, `ProductFeedService` (merges MS data with UGC via `UgcRepo`, `UgcMetaRepo`).

### 3.4 Image Proxy Helpers
To safely serve MoySklad images to clients without exposing credentials or running into CORS:

- `/image-by-url?href=<MS_URL>` — validates host, resolves `downloadHref` from `entity/image/{id}` or `.../download/{id}`, streams image with correct headers and caching.
- `/external?url=<ALLOWED_URL>` — proxy for whitelisted hosts (e.g., `miniature-prod.moysklad.ru`).

---

## 4) Local Development & Docker

### Option A — Local (no Docker)

```bash
npm install

# Start MongoDB (pick one):
docker run -d --name product-mongo -p 27017:27017 mongo:6
# or run a local mongod instance

# Run in dev (hot reload)
npm run dev
# or build & start
npm run build
npm start
```

- Health: `http://localhost:3000/health` → `{ "ok": true }`
- Swagger: `http://localhost:3000/docs` (raw spec: `/docs.json`)

### Option B — Docker Compose

`docker-compose.yml` defines **app** and **mongo** services.

```bash
docker-compose up --build
```

- The app will use `./.env` (`env_file`), plus `MONGO_HOST=mongo` and `MONGO_DB` from compose env.
- Healthcheck (from compose): `GET http://localhost:${PORT}/health`
- Swagger: `http://localhost:${PORT}/docs`

> If you need to live-edit code inside the container, uncomment the `volumes` section in `docker-compose.yml`.

---

## 5) HTTP Routes

### 5.1 Operational
- `GET /health` → `{ ok: true }`
- `GET /api/ping` → `"pong"`
- `GET /test` → `"All is good"`

### 5.2 Auth — Email Verification (SMTP)

- `POST /auth/email/request` — request 6‑digit code (valid ~1 hour).  
  If a valid code was requested **< 60s** ago, the request is accepted without re-sending.

  **Body**
  ```json
  { "email": "user@example.com" }
  ```
  **200 OK** → `{ "ok": true }` • **422** → `{ "error": "invalid_email" }`

- `POST /auth/email/verify` — verify the 6‑digit code. Single-use, expires ~1 hour.

  **Body**
  ```json
  { "email": "user@example.com", "code": "123456" }
  ```
  **200 OK** → `{ "ok": true, "userExists": false }`  
  **401** → `{ "error": "invalid_code" }` or `{ "error": "expired_code" }`  
  **422** → `{ "error": "invalid_input" }`

### 5.3 MoySklad Market & Images

- `GET /products` — list products from MoySklad enriched with UGC.

  **Query params**
  - `limit` *(int, default 50)* — page size. When `includeImages=true`, max **100**.
  - `offset` *(int, default 0)* — pagination offset.
  - `search` *(string)* — search term for assortment.
  - `includeImages` *(boolean)* — expand images; service will enrich if missing.
  - `onlyActive` *(boolean, default true)* — exclude archived (`archived=false`).
  - `reviewsLimit` *(int, default 3)* — number of recent reviews per product.

  **200 OK**
  ```json
  {
    "items": [ /* MarketCatalogItem[] */ ],
    "nextOffset": 100,
    "rate": { "limit": 60, "remaining": 59, "retryAfter": 0 }
  }
  ```

- `GET /image-by-url?href=<moysklad_url>` — resolve and stream MoySklad image (entity/download).  
  **400** invalid host/path • **404** not found • **502** upstream failure.

- `GET /external?url=<allowed_url>` — proxy image from whitelisted host(s), e.g. `miniature-prod.moysklad.ru`.

### 5.4 Transactions
- `POST /transactions` — create transaction.  
  **Body** → `TransactionCreateInput`
  ```json
  { "userId": "user123", "amount": 2500, "products": ["<id1>", "<id2>"] }
  ```
  **201 Created** → `Transaction`

- `GET /transactions` — list transactions.  
  **200 OK** → `Transaction[]`

> **Swagger tags:** `Auth`, `MoySklad`, `Transactions`  
> **Schemas:** `EmailRequest`, `EmailVerifyRequest`, `AuthOk`, `AuthVerifyOk`, `ErrorResponse`, `MarketCatalogItem`, `Review`, `RateInfo`, `ListMarketProductsResponse`, `Transaction`, `TransactionCreateInput`.

---

## 6) Scripts

From `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon -r dotenv/config --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "format": "prettier --write ."
  }
}
```

- **Dev:** `npm run dev` (dotenv loaded, ts-node via nodemon)  
- **Build:** `npm run build` (emits `dist`)  
- **Start:** `npm start` (runs compiled server)

---

## 7) Troubleshooting

- **Swagger not found** → ensure server started; docs mounted at `/docs`. Raw spec: `/docs.json`.
- **Mongo connection issues** → verify `MONGO_HOST`/`MONGO_DB` (or `MONGO_URL`) and that Mongo is running (`docker ps`, container logs).
- **SMTP errors** → check `SMTP_*`, port/TLS; for Gmail use **App Passwords**.
- **MoySklad rate-limits (429)** → `RetryService` respects upstream headers; consider increasing `MS_MAX_RETRIES` and watch `retryAfter`.
- **Images missing** → use `includeImages=true`; effective limit ≤ **100**; enrichment will try self collection then parent product.
- **Module not found (`swagger-jsdoc`, etc.)** → `npm install` to re-install deps.

