import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from './schema'

const databaseUrl = Bun.env.DATABASE_URL ?? './data/groov.db'
mkdirSync(path.dirname(path.resolve(databaseUrl)), { recursive: true })

export const db = drizzle(databaseUrl, { schema })
