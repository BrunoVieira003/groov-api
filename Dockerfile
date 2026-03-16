FROM oven/bun:latest AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src
COPY ./drizzle ./drizzle
COPY drizzle.config.ts drizzle.config.ts

RUN bun run build-js
RUN ls node_modules
RUN ls node_modules/bee-queue/lib

FROM oven/bun:latest

WORKDIR /app

COPY --from=build /app/build/server.js server.js
COPY --from=build /app/drizzle drizzle
COPY --from=build /app/node_modules node_modules

RUN bun add bee-queue
RUN ls
RUN ls node_modules
RUN ls node_modules/bee-queue/lib
RUN ls node_modules/bee-queue/lib/lua

CMD ["bun ./server.js"]

EXPOSE 3000