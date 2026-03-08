FROM oven/bun:latest as build
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build
RUN pwd && ls -la

FROM oven/bun:latest
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/drizzle ./drizzle
COPY --from=build /usr/src/app/build ./build

EXPOSE 3000

CMD ["bun", "run", "./build/index.js"]