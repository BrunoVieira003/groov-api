FROM oven/bun:1.3.6-slim AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src

RUN bun run build

FROM oven/bun:1.3.6-distroless

WORKDIR /app

COPY --from=build /app/build/server server
COPY ./drizzle drizzle
COPY drizzle.config.ts drizzle.config.ts

CMD ["/app/server"]

EXPOSE 3000