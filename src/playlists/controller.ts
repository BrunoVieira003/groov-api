import Elysia, { status } from "elysia";
import { addSongSchema, createPlaylistSchema, removeSongSchema, updatePlaylistSchema } from "./schema";
import { PlaylistService } from "./service";

export const playlistRouter = new Elysia({prefix: 'playlists'})
    .post('', async ({body}) => {
        const playlist = await PlaylistService.create(body.title)
        return playlist
    }, {body: createPlaylistSchema})

    .get('', async () => {
        const playlists = await PlaylistService.getAll()
        return playlists
    })

    .get(':id', async ({params}) => {
        const playlists = await PlaylistService.getById(params.id)
        return playlists
    })

    .patch(':id', async ({params, body}) => {
        await PlaylistService.update(params.id, body)
    }, {body: updatePlaylistSchema})

    .post(':id/song', async ({params, body}) => {
        await PlaylistService.addSong(params.id, body.songId)
        return status(201)
    }, {body: addSongSchema})

    .delete(':id/song', async ({params, body}) => {
        await PlaylistService.removeSong(params.id, body.songId)
    }, {body: removeSongSchema})