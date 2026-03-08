FROM oven/bun:latest as build

COPY package.json bun.lock ./
RUN bun install

COPY ./src ./src
COPY tsconfig.json ./tsconfig.json
COPY ./drizzle ./drizzle
RUN bun run build

RUN ls

FROM oven/bun:latest
COPY --from=build ./package.json ./
COPY --from=build ./node_modules ./node_modules
COPY --from=build ./drizzle ./drizzle
COPY --from=build ./build ./build

CMD ["bun", "run", "./build/index.js"]