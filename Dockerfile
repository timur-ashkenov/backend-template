ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS base

ENV npm_config_fund=false \
    npm_config_audit=false \
    NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache bash curl

FROM base AS deps

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM base AS builder
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runtime

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

ENV PORT=${PORT}
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e "fetch('http://localhost:' + process.env.PORT + '/health').then(r=>{if(r.ok)process.exit(0);process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]