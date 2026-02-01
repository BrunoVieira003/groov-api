import { Elysia } from "elysia";
import { songRouter } from "./song/controller";
import { migrate } from 'drizzle-orm/bun-sql/migrator'
import { db } from "./database";
import cors from "@elysiajs/cors";
import { artistRouter } from "./artists/controller";
import { taskRouter } from "./tasks/controller";

console.info("Bun env", Bun.env)
console.log("Bun env", Bun.env)
console.error("Bun env", Bun.env)
console.warn("Bun env", Bun.env)
console.debug("Bun env", Bun.env)
await migrate(db, { migrationsFolder: '/drizzle' })

const app = new Elysia()
  .use(cors())
  .use(taskRouter)
  .use(songRouter)
  .use(artistRouter)
  .listen(3000);

console.log(
  `🦊 Groov-api is running at ${app.server?.hostname}:${app.server?.port}`
);
