FROM oven/bun:latest as base
WORKDIR /usr/src/app

COPY package.json ./
COPY bun.lock ./
RUN bun install

COPY src ./
RUN bun run build

FROM oven/bun:latest
COPY --from=build ./package.json ./
COPY --from=build ./node_modules ./
COPY --from=build ./build ./

CMD ["bun", "run", "./build/index.js"]