FROM oven/bun:latest AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src
COPY ./drizzle ./drizzle
COPY drizzle.config.ts drizzle.config.ts

RUN bun run build
RUN ls

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/build/server server
COPY --from=build /app/drizzle drizzle

RUN bun add bee-queue

CMD ["./server"]

EXPOSE 3000