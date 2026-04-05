import { relations } from "drizzle-orm";
import { pgTable, primaryKey, smallint, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const albums = pgTable('albums', {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar('name').notNull(),
    year: smallint(),
    artistId: uuid().references(() => artists.id, {onDelete: 'set null'}),
    coverArtFormat: varchar('album_cover_art_format')
})

export const songs = pgTable('songs', {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar('title').notNull(),
    year: smallint(),
    filename: varchar('filename').notNull().unique('song_filename_unique'),
    coverArtFormat: varchar('cover_art_format'),
    color: varchar('color'),
    contrastColor: varchar('contrast_color'),
    albumId: uuid("album_id").references(() => albums.id, {onDelete: 'set null'}),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const songsRelations = relations(songs, ({one, many}) => ({
    album: one(albums, { fields: [songs.albumId], references: [albums.id] }),
    authors: many(songsToArtists),
    playlists: many(songsToPlaylists)
}))

export const artists = pgTable('artists', {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar('name').notNull().unique('artist_name_unique')
})

export const artistsRelations = relations(artists, ({many}) => ({
    songs: many(songsToArtists),
    albums: many(albums)
}))

export const songsToArtists = pgTable('songs_to_artists', {
    songId: uuid().notNull().references(() => songs.id, {onDelete: 'cascade'}),
    artistId: uuid().notNull().references(() => artists.id, {onDelete: 'cascade'})
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

export const playlists = pgTable('playlists', {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar('title').notNull(),
})

export const playlistsRelations = relations(playlists, ({many}) => ({
    songs: many(songsToPlaylists)
}))

export const songsToPlaylists = pgTable('songs_to_playlists', {
    songId: uuid().notNull().references(() => songs.id, {onDelete: 'cascade'}),
    playlistId: uuid().notNull().references(() => playlists.id, {onDelete: 'cascade'})
})

export const songsToPlaylistsRelations = relations(songsToPlaylists, ({one}) => ({
    song: one(songs, {
        fields: [songsToPlaylists.songId],
        references: [songs.id],
    }),
    playlist: one(playlists, {
        fields: [songsToPlaylists.playlistId],
        references: [playlists.id]
    }),
}))

export const albumsRelations = relations(albums, ({ one, many }) => ({
    artist: one(artists, {
        fields: [albums.artistId],
        references: [artists.id],
    }),
    songs: many(songs),
}));