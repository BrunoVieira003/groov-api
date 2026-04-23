FROM oven/bun:1.3.6-alpine AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src
COPY ./drizzle ./drizzle
COPY drizzle.config.ts drizzle.config.ts

RUN bun run build

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/build/server server
COPY --from=build /app/drizzle drizzle
COPY --from=build /app/drizzle.config.ts drizzle.config.ts

CMD ["/app/server"]

EXPOSE 3000