# ── Stage 1: build del frontend React ────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build args VITE_* — vengono baked nel bundle JS al build time
ARG VITE_SHOPWARE_API_URL
ARG VITE_SHOPWARE_ACCESS_KEY
ARG VITE_SHOPWARE_STOREFRONT_URL
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_PAYPAL_CLIENT_ID
ARG VITE_B2B_CATEGORY_ID
ARG VITE_B2B_GROUP_NAME
ARG VITE_STRAPI_URL
ARG VITE_STRAPI_TOKEN
ARG VITE_GTM_ID

ENV VITE_SHOPWARE_API_URL=$VITE_SHOPWARE_API_URL \
    VITE_SHOPWARE_ACCESS_KEY=$VITE_SHOPWARE_ACCESS_KEY \
    VITE_SHOPWARE_STOREFRONT_URL=$VITE_SHOPWARE_STOREFRONT_URL \
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY \
    VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID \
    VITE_B2B_CATEGORY_ID=$VITE_B2B_CATEGORY_ID \
    VITE_B2B_GROUP_NAME=$VITE_B2B_GROUP_NAME \
    VITE_STRAPI_URL=$VITE_STRAPI_URL \
    VITE_STRAPI_TOKEN=$VITE_STRAPI_TOKEN \
    VITE_GTM_ID=$VITE_GTM_ID

COPY . .
RUN npx vite build

# ── Stage 2: runtime (nginx + node Express) ───────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache nginx curl

# Dipendenze backend (solo produzione, senza devDeps)
COPY package*.json ./
RUN npm ci --omit=dev

# Backend Express + cartella api (INDISPENSABILE: server.js la importa)
COPY server.js ./
COPY api/ ./api/

# Frontend buildato
COPY --from=builder /app/dist ./dist

# Configurazione nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# Entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["./docker-entrypoint.sh"]
