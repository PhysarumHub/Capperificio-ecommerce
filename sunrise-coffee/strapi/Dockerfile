FROM node:20-alpine
WORKDIR /opt/app

# Dipendenze produzione
COPY package*.json ./
RUN npm ci --omit=dev

# Codice sorgente e admin già buildato (build/ è incluso)
COPY . .

EXPOSE 1337

CMD ["node_modules/@strapi/strapi/bin/strapi.js", "start"]
