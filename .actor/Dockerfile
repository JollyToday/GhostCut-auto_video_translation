FROM node:22-bookworm-slim
WORKDIR /app
COPY integrations/apify/package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY integrations/apify/main.mjs ./main.mjs
COPY examples/media.mjs examples/Weydub.postman_collection.json ./examples/
CMD ["node","main.mjs"]
