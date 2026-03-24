# ── Stage 1: build del frontend React ────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Dichiara build args — passati da docker-compose come variabili VITE_*
ARG VITE_SHOPWARE_API_URL
ARG VITE_SHOPWARE_ACCESS_KEY
ARG VITE_SHOPWARE_STOREFRONT_URL
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_PAYPAL_CLIENT_ID
ARG VITE_B2B_CATEGORY_ID
ARG VITE_B2B_GROUP_NAME

# Esporta come env vars per Vite (le bake nel bundle JS)
ENV VITE_SHOPWARE_API_URL=$VITE_SHOPWARE_API_URL
ENV VITE_SHOPWARE_ACCESS_KEY=$VITE_SHOPWARE_ACCESS_KEY
ENV VITE_SHOPWARE_STOREFRONT_URL=$VITE_SHOPWARE_STOREFRONT_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID
ENV VITE_B2B_CATEGORY_ID=$VITE_B2B_CATEGORY_ID
ENV VITE_B2B_GROUP_NAME=$VITE_B2B_GROUP_NAME

COPY . .
RUN npx vite build

# ── Stage 2: runtime (nginx per frontend + node per backend) ──────────
FROM node:20-alpine

WORKDIR /app

# Installa nginx
RUN apk add --no-cache nginx

# Dipendenze backend (solo produzione)
COPY package*.json ./
RUN npm ci --omit=dev

# Backend e frontend buildato
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Config nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# Entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 80 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
