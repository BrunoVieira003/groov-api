import { Elysia } from "elysia";
import { songRouter } from "./song/controller";

const app = new Elysia()
  .use(songRouter)
  .listen(3000);

console.log(
  `🦊 Groov-api is running at ${app.server?.hostname}:${app.server?.port}`
);
