FROM oven/bun:latest as build
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:latest
COPY --from=build ./package.json ./
COPY --from=build ./node_modules ./node_modules
COPY --from=build ./drizzle ./drizzle
COPY --from=build ./build ./build

EXPOSE 3000

CMD ["bun", "run", "./build/index.js"]