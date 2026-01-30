import { relations } from "drizzle-orm";
import { pgTable, primaryKey, smallint, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const songs = pgTable('songs', {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar('title').notNull(),
    year: smallint(),
    filename: varchar('filename').notNull().unique('song_filename_unique'),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const songsRelations = relations(songs, ({many}) => ({
    authors: many(songsToArtists)
}))

export const artists = pgTable('artists', {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar('name').notNull().unique('artist_name_unique')
})

export const artistsRelations = relations(artists, ({many}) => ({
    songs: many(songsToArtists)
}))

export const songsToArtists = pgTable('songs_to_artists', {
    songId: uuid().notNull().references(() => songs.id),
    artistId: uuid().notNull().references(() => artists.id)
}, (t) => [
    primaryKey({columns: [t.songId, t.artistId]})
])

export const songsToArtistsRelations = relations(songsToArtists, ({one}) => ({
    song: one(songs, {
        fields: [songsToArtists.songId],
        references: [songs.id]
    }),
    artist: one(artists, {
        fields: [songsToArtists.artistId],
        references: [artists.id]
    })
}))