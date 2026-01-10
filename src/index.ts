import { Elysia } from "elysia";
import { songRouter } from "./song/controller";
import { migrate } from 'drizzle-orm/bun-sql/migrator'
import { db } from "./database";

await migrate(db, { migrationsFolder: '/drizzle' })

const app = new Elysia()
  .use(songRouter)
  .listen(3000);

console.log(
  `🦊 Groov-api is running at ${app.server?.hostname}:${app.server?.port}`
);
