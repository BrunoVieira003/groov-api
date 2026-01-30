import Elysia from "elysia";
import SongService from "./service";

export const songRouter = new Elysia({ prefix: '/songs' })
    .get('', async () => {
        const songs = await SongService.getAll()
        return { songs }
    })
    .get('/:id', async ({ params, set }) => {
        const songFile = await SongService.getSongFileById(params.id)

        set.headers["content-type"] = "audio/mpeg"
        set.headers["accept-ranges"] = "bytes"

        return songFile

    })
    .get('/:id/cover', async ({ params, set }) => {
        const songFile = await SongService.getCoverBySongId(params.id)

        set.headers["content-type"] = songFile.type

        return songFile

    })
    .get('/:id/stat', async ({ params }) => {
        const song = await SongService.getSongById(params.id)

        return { song }
    })