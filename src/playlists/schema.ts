import { t } from "elysia";

export const createPlaylistSchema = t.Object({
    title: t.String()
})

export const addSongSchema = t.Object({
    songId: t.String({format: 'uuid'})
})

export const removeSongSchema = t.Object({
    songId: t.String({format: 'uuid'})
})