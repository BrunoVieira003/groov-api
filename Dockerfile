FROM oven/bun:latest AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src
COPY ./drizzle ./drizzle

RUN bun run build-js
RUN ls

FROM oven/bun:latest

WORKDIR /app

COPY --from=build /app/build/server.js server.js
COPY --from=build /app/drizzle drizzle

ENV NODE_ENV=production

CMD ["bun ./server.js"]

EXPOSE 3000