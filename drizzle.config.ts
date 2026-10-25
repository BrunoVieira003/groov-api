import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    out: 'drizzle',
    schema: 'src/database/schema.ts',
    dialect: 'sqlite',
    dbCredentials: {
        url: Bun.env.DATABASE_URL!
    }
})