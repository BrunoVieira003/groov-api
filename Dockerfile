FROM oven/bun:1.3.14-slim AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src

RUN bun run build

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/build/server server
COPY ./drizzle drizzle
COPY drizzle.config.ts drizzle.config.ts

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

CMD ["/app/server"]

EXPOSE 3000