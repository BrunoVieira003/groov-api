import { Elysia } from "elysia";
import { songRouter } from "./song/controller";
import { migrate } from 'drizzle-orm/bun-sql/migrator'
import { db } from "./database";
import cors from "@elysiajs/cors";

await migrate(db, { migrationsFolder: '/drizzle' })

const app = new Elysia()
  .use(songRouter)
  .use(cors())
  .listen(3000);

console.log(
  `🦊 Groov-api is running at ${app.server?.hostname}:${app.server?.port}`
);
