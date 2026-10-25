import { Elysia } from "elysia";
import { songRouter } from "./resources/song/controller";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./database";
import cors from "@elysiajs/cors";
import { artistRouter } from "./resources/artists/controller";
import { taskRouter } from "./resources/tasks/controller";
import { toolsRouter } from "./resources/tools/controller";
import { playlistRouter } from "./resources/playlists/controller";
import { albumRouter } from "./resources/albums/controller";
import { sql } from "drizzle-orm";
import openapi from "@elysia/openapi";


migrate(db, { migrationsFolder: './drizzle' })


const app = new Elysia()
  .use(cors())
  .use(openapi({ path: '/docs', documentation: {info: {title: 'Groov API', version: '0.0.1'}} }))
  .use(taskRouter)
  .use(songRouter)
  .use(artistRouter)
  .use(albumRouter)
  .use(playlistRouter)
  .use(toolsRouter)
  .get('/health', async ({ status }) => {
    try {
      await db.run(sql`SELECT 1`)

      return status(200, { status: 'Ok' })
    } catch (e) {
      return status(503, { status: 'Database connection failed' })
    }
  })
  .listen(3000);

console.log(
  `🦊 Groov-api is running at ${app.server?.hostname}:${app.server?.port}`
);
