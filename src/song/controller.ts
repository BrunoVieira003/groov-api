import Elysia, { ElysiaFile, file } from "elysia";
import SongService from "./service";
import { RangeHeaderSchema, songQuerySchema, uploadBodySchema } from "./schema";
import { write } from "bun";
import path from "node:path"
import { filesDir } from "../constants";
import { readFileQueue } from "../lib/queues/read-file";
import { createReadStream } from "node:fs";

export const songRouter = new Elysia({ prefix: '/songs' })
    .get('', async ({ query }) => {
        const songs = await SongService.getAll({
            field: query.sortField,
            order: query.sortOrder
        })
        return { songs }
    }, { query: songQuerySchema })

    .get('/:id', async ({ params, set, headers }) => {
        const songFile = await SongService.getSongFileById(params.id)
        const size = songFile.size

        const range = headers['range']
        if (!range) {
            set.headers["Content-Type"] = songFile.type
            set.headers["Accept-Ranges"] = "bytes"
            return createReadStream(songFile.name || '')
        }

        const [_, startStr, endStr] = /bytes=(\d*)-(\d*)/.exec(range) ?? []
        const start = startStr ? Number(startStr) : 0
        const end = endStr ? Number(endStr) : size - 1

        set.status = 206
        set.headers["Content-Type"] = songFile.type
        set.headers["Accept-Ranges"] = "bytes"
        set.headers["Content-Range"] = `bytes ${start}-${end}/${size}`
        set.headers["Content-Length"] = `${end - start + 1}`

        return createReadStream(songFile.name || '', { start, end })
    }, { headers: RangeHeaderSchema })

    .get('/:id/cover', async ({ params, set }) => {
        const songFile = await SongService.getCoverBySongId(params.id)

        set.headers["content-type"] = songFile.type

        return songFile

    })

    .get('/:id/stat', async ({ params }) => {
        const song = await SongService.getSongById(params.id)

        return { song }
    })

    .get('/:id/lyrics', async ({ params, set }) => {
        const lyrics = await SongService.getSongLyricsById(params.id)

        return lyrics
    })

    .post('/upload', async ({ body }) => {
        const file = body.file
        const filename = body.file.name

        const filepath = path.join(filesDir, filename)
        await write(filepath, file)

        const job = await readFileQueue.add('read-file', { filename })

        return { taskId: job.id }
    }, { body: uploadBodySchema })