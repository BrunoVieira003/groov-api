import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export interface Palette{
    vibrant: string | undefined
    darkVibrant: string | null | undefined
    lightVibrant: string | null | undefined
    muted: string | null | undefined
    darkMuted: string | null | undefined
    lightMuted: string | null | undefined
}

const uuid = (name?: string) => text(name).$defaultFn(() => crypto.randomUUID())
const createdAt = (name?: string) => text(name).$default(() => new Date().toISOString()).notNull()
const updatedAt = (name?: string) => text(name).$onUpdate(() => new Date().toISOString()).notNull()

const colors = (name: string) => text(name, { mode: 'json'}).$type<Palette>()

const timestamps = {
    createdAt: createdAt('created_at'),
    updatedAt: updatedAt('updated_at')
}

export const albums = sqliteTable('albums', {
    id: uuid().primaryKey(),
    title: text('name').notNull(),
    year: integer(),
    colors: colors('colors'),
    artistId: uuid().references(() => artists.id, {onDelete: 'set null'}),
})

export const songs = sqliteTable('songs', {
    id: uuid().primaryKey(),
    title: text('title').notNull(),
    year: integer(),
    filename: text('filename').notNull().unique('song_filename_unique'),
    duration: integer('duration'),
    colors: colors('colors'),
    albumId: uuid("album_id").references(() => albums.id, {onDelete: 'set null'}),
    fingerprint: text('fingerprint'),
    ...timestamps
});

export const songsRelations = relations(songs, ({one, many}) => ({
    album: one(albums, { fields: [songs.albumId], references: [albums.id] }),
    authors: many(songsToArtists),
    playlists: many(songsToPlaylists)
}))

export const artists = sqliteTable('artists', {
    id: uuid().primaryKey(),
    name: text('name').notNull().unique('artist_name_unique')
})

export const artistsRelations = relations(artists, ({many}) => ({
    songs: many(songsToArtists),
    albums: many(albums)
}))

export const songsToArtists = sqliteTable('songs_to_artists', {
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

export const playlists = sqliteTable('playlists', {
    id: uuid().primaryKey(),
    title: text('title').notNull(),
})

export const playlistsRelations = relations(playlists, ({many}) => ({
    songs: many(songsToPlaylists)
}))

export const songsToPlaylists = sqliteTable('songs_to_playlists', {
    id: uuid().primaryKey(),
    songId: uuid().notNull().references(() => songs.id, {onDelete: 'cascade'}),
    playlistId: uuid().notNull().references(() => playlists.id, {onDelete: 'cascade'}),
    trackNumber: integer()
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