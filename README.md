# 🧩 Product Store — Backend Template

Backend template for **products**, **email verification via SMTP**, **MoySklad integration**, and **transactions**.  
Built with **Node.js + Express + TypeScript + MongoDB** and documented with **Swagger (OpenAPI)**. Docker Compose is included for local development.

---

## 0) Prerequisites

Install the following tools before you start:

- [Node.js (v20+)](https://nodejs.org/en/download/)
- [npm (v9+)](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) _(bundled with Node)_
- [MongoDB Community (v6+)](https://www.mongodb.com/try/download/community)
- [MongoDB Compass](https://www.mongodb.com/products/tools/compass) _(GUI client — used to import JSON seed data)_
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) _(for containerized setup)_
- [mkcert](https://github.com/FiloSottile/mkcert) _(for local HTTPS certificates)_

> **You always need Node.js + npm.**  
> **MongoDB + Compass** are needed if you prefer running locally without Docker or if you want to import seed data via GUI.  
> **Docker** is needed only for the containerized setup.
> **mkcert** is needed to run the backend locally over HTTPS.

---

## 1) Clone the Repository

```bash
git clone https://github.com/shivada727/backend-template.git
cd backend-template
git checkout demonstration
```

## 1.1) Enviromental variables

Before running the project, clone a .env file into the root directory of the project (backend-template/.env).

---

## 2) Project Overview

This service provides:

- **Product catalog** from **MoySklad** (normalized to a frontend-friendly shape, UGC enrichment, safe image proxy).
- **Email verification (SMTP)**: request & verify a 6‑digit code.
- **Transactions**: create/list transactions persisted in MongoDB.
- **Healthcheck**: `/health`, `/api/ping`, `/test`.
- **Swagger UI**: `/docs` (raw spec: `/docs.json`).

---

## 3) Database Initialization

On startup, the backend **creates indexes automatically**:

- `productStats` → unique index on `productId`
- `reviews` → compound index on (`productId`, `createdAt`)
- `ugcMeta` → unique index on `productId`

The database (`productdb` by default) is created automatically at first insert.

### Import seed data **with MongoDB Compass**

Use the JSON files provided in the repo to prefill collections:

- `productStats.json` → `productStats` collection
- `reviews.json` → `reviews` collection
- `ugc-meta.json` → `ugcMeta` collection

**Steps (MongoDB Compass):**

1. Open **MongoDB Compass**.
2. Connect to your database:
    - Local (no Docker): `mongodb://127.0.0.1:27017/productdb`
    - Docker Compose: `mongodb://localhost:27017/productdb`
3. In the collections you need to delete all data if there any and click green button **Add Data**. Choose Import JSON or CSVN file
4. For each collection (`productStats`, `reviews`, `ugcMeta`) you are picking the right .json file.

After import, you can immediately test `/products` (UGC enrichment will use these documents).

> If you run Mongo inside Docker, Compass connects to the host's mapped port (`localhost:27017`) — Compose already exposes it.

---

## 4) Local Https Setup

For local development the backend runs on `https://localhost`
You need to generate TLS certificates using `mkcert`

`MacOS`
```bash
brew install mkcert nss
mkcert -install
mkcert localhost 127.0.0.1 ::1
mkdir -p certificates
mv localhost+2.pem certificates/localhost.pem
mv localhost+2-key.pem certificates/localhost.key
```

`Linux`
1. Download mkcert binary from [realease](https://github.com/FiloSottile/mkcert/releases)
2. Move it to your path and make it executable:
```bash
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
sudo chmod +x /usr/local/bin/mkcert
```
3. Install local CA:
```bash
mkcert -install
```
4. Generate Certs:
```bash
mkcert localhost 127.0.0.1 ::1
mkdir -p cerificates
mv localhost+2.pem certificates/localhost.pem
mv localhost+2-key.pem certificates/localhost.key
```

`Windows`
1. Install [Chocolatey](https://chocolatey.org/install)
2. Run PowerShell as Administrator:
```powershell
choco install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
mkdir certificates
move localhost+2.pem certificates/localhost.pem
move localhost+2-key.pem certificates/localhost.key
```


## 5) Local Development (without Docker)

```bash
# Install dependencies
npm install

# Run the server in dev mode (hot reload)
npm run dev
```

Open in the browser:

- Healthcheck → https://localhost:3000/health
- Swagger UI → https://localhost:3000/docs

---

## 6) Run with Docker Compose

1. Build and start containers:

```bash
docker-compose up --build
```

2. Verify containers are up:

```bash
docker ps
```

You should see:

- `product-store_app` (backend)
- `product-store_mongo` (MongoDB)

3. Verify in the browser:

- Healthcheck → https://localhost:3000/health → should return `{ "ok": true }`
- Swagger UI → https://localhost:3000/docs

4. Stop containers when done:

```bash
docker-compose down
```

---

## 7) HTTP Routes (highlights)

### Operational

- `GET /health` → `{ ok: true }`
- `GET /api/ping` → `"pong"`
- `GET /test` → `"All is good"`

### Auth — Email Verification (SMTP)

- `POST /auth/email/request` → request a 6‑digit code (valid ~1h; 60s re‑request guard)
- `POST /auth/email/verify` → verify the code (single‑use; expires ~1h)

### MoySklad Market & Images

- `GET /products` → list products (supports `limit`, `offset`, `search`, `includeImages`, `onlyActive`, `reviewsLimit`)
- `GET /image-by-url?href=...` → resolve & stream an image from MoySklad
- `GET /external?url=...` → proxy image from whitelisted hosts

### Transactions

- `POST /transactions` → create
- `GET /transactions` → list

---

## 7) Scripts

```json
{
    "dev": "nodemon -r dotenv/config --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "format": "prettier --write ."
}
```

- `npm run dev` → development (ts-node + nodemon)
- `npm run build` → compile TypeScript to `dist`
- `npm start` → run compiled server

---

## 8) Troubleshooting

- **Swagger not found** → ensure server started; docs mounted at `/docs` (`/docs.json` for spec).
- **Mongo connection issues** → check that Mongo is running and Compass connects to `productdb`.
- **SMTP errors** → verify `SMTP_*` and TLS/ports; Gmail requires **App Passwords**.
- **MoySklad 429** → the integration layer honors upstream rate headers; wait for `retryAfter`.
- **Images missing** → use `includeImages=true`; effective limit ≤ **100**; enrichment tries self collection then parent product.
- **Browser still warns about certificate** → restart the browser, ensure mkcert CA is installed.