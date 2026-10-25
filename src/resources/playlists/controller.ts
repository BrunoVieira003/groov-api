import Elysia, { status } from "elysia";
import { addSongSchema, changePlaylistCoverSchema, createPlaylistSchema, removeSongSchema, reorderPlaylistSchema, updatePlaylistSchema } from "./schema";
import { PlaylistService } from "./service";

export const playlistRouter = new Elysia({prefix: 'playlists', tags: ['Playlists']})
    .post('', async ({body}) => {
        const playlist = await PlaylistService.create(body.title)
        return playlist
    }, {body: createPlaylistSchema, detail: {summary: 'Create playlist'}} )

    .get('', async () => {
        const playlists = await PlaylistService.getAll()
        return { playlists }
    }, {detail: {summary: 'Get playlists'}})

    .get(':id', async ({params}) => {
        const playlists = await PlaylistService.getById(params.id)
        return playlists
    }, {detail: {summary: 'Get playlist by id'}})

    .get('/:id/cover', async ({ params, set }) => {
        const songFile = await PlaylistService.getCoverByPlaylistId(params.id)

        set.headers["content-type"] = songFile.type

        return songFile
    }, {detail: {summary: 'Get album cover by id'}})

    .patch(':id', async ({params, body}) => {
        await PlaylistService.update(params.id, body)
    }, {body: updatePlaylistSchema, detail: {summary: 'Update playlist title'}})

    .patch(':id/cover', async ({params, body}) => {
        await PlaylistService.changeCover(params.id, body.file)
    }, {body: changePlaylistCoverSchema, detail: {summary: 'Update playlist cover'}})

    .patch(':id/reorder', async ({params, body}) => {
        await PlaylistService.reorder(params.id, body.relationIds)
    }, {body: reorderPlaylistSchema, detail: {summary: 'Reorder playlist songs'}})

    .delete(':id', async ({params}) => {
        await PlaylistService.delete(params.id)
        return status(204)
    }, {detail: {summary: 'Delete playlist'}})

    .post(':id/song', async ({params, body}) => {
        await PlaylistService.addSong(params.id, body.songId)
        return status(201)
    }, {body: addSongSchema, detail: {summary: 'Add song to playlist'}})

    .delete(':id/song', async ({params, body}) => {
        await PlaylistService.removeSong(params.id, body.relationId)
    }, {body: removeSongSchema, detail: {summary: 'Remove song to playlist'}})