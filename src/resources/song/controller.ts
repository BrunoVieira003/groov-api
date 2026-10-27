import Elysia, { status } from "elysia";
import SongService from "./service";
import { RangeHeaderSchema, songQuerySchema, uploadBodySchema } from "./schema";
import { write } from "bun";
import path from "node:path"
import { filesDir, supportedFileFormats } from "../../lib/constants";
import { readFileQueue } from "../../lib/queues/read-file";
import { createReadStream, existsSync } from "node:fs";

export const songRouter = new Elysia({ prefix: '/songs', tags: ['Songs'] })
    .get('', async ({ query }) => {
        const songs = await SongService.getAll({
            field: query.sortField,
            order: query.sortOrder
        })
        return { songs }
    }, { query: songQuerySchema, detail: {summary: 'Get songs'} })

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

        let start: number
        let end: number
        if (!startStr && endStr) {
            // suffix range: last N bytes
            start = Math.max(size - Number(endStr), 0)
            end = size - 1
        } else {
            start = startStr ? Number(startStr) : 0
            end = endStr ? Math.min(Number(endStr), size - 1) : size - 1
        }

        if (start >= size || start > end) {
            set.status = 416
            set.headers["Content-Range"] = `bytes */${size}`
            return
        }

        set.status = 206
        set.headers["Content-Type"] = songFile.type
        set.headers["Accept-Ranges"] = "bytes"
        set.headers["Content-Range"] = `bytes ${start}-${end}/${size}`
        set.headers["Content-Length"] = `${end - start + 1}`

        return createReadStream(songFile.name || '', { start, end })
    }, { headers: RangeHeaderSchema, detail: {summary: 'Get song file'} })

    .get('/:id/cover', async ({ params, set }) => {
        const songFile = await SongService.getCoverBySongId(params.id)

        set.headers["content-type"] = songFile.type

        return songFile

    }, { detail: {summary: 'Get song cover'} })

    .get('/:id/stat', async ({ params }) => {
        const song = await SongService.getSongById(params.id)

        return { song }
    }, { detail: {summary: 'Get song data'} })

    .get('/:id/lyrics', async ({ params, set }) => {
        const lyrics = await SongService.getSongLyricsById(params.id)

        return lyrics
    }, { detail: {summary: 'Get song lyrics'} })

    .post('/upload', async ({ body }) => {
        const file = body.file
        const filename = path.basename(body.file.name)

        const extension = path.extname(filename).slice(1).toLowerCase()
        if (!supportedFileFormats.includes(extension)) {
            return status(415, { message: `Unsupported file format. Supported: ${supportedFileFormats.join(', ')}` })
        }

        const filepath = path.join(filesDir, filename)
        if (existsSync(filepath)) {
            return status(409, { message: 'A file with this name already exists' })
        }

        await write(filepath, file)

        const job = await readFileQueue.add('read-file', { filename })

        return { taskId: job.id }
    }, { body: uploadBodySchema, detail: {summary: 'Upload new song'} })