import { t } from "elysia";

export const createPlaylistSchema = t.Object({
    title: t.String()
})

export const updatePlaylistSchema = t.Object({
    title: t.Optional(t.String()),
})

export const changePlaylistCoverSchema = t.Object({
    file: t.File({type: ['image/jpeg', 'image/png', 'image/webp']}),
})

export const reorderPlaylistSchema = t.Object({
    relationIds: t.Array(t.String())
})

export const addSongSchema = t.Object({
    songId: t.String({format: 'uuid'})
})

export const removeSongSchema = t.Object({
    relationId: t.String({format: 'uuid'})
})