# --- build stage ---
FROM oven/bun:1.1 AS builder
WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
RUN bun install

COPY src ./src
RUN bun run build-api

# --- runtime stage ---
FROM oven/bun:1.1-slim
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["bun", "./dist/index.js"]