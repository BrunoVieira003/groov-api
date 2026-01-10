import { pgTable, smallint, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const songs = pgTable('songs', {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar('title').notNull(),
    year: smallint(),
    filename: varchar('filename').notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});