import Elysia, { status } from "elysia";
import SongService from "./service";
import { RangeHeaderSchema, songQuerySchema, uploadBodySchema } from "./schema";
import { write } from "bun";
import path from "node:path"
import { filesDir, supportedFileFormats } from "../../lib/constants";
import { coverHeadersSchema, coverResponse, streamFile } from "../../lib/http";
import { readFileQueue } from "../../lib/queues/read-file";
import { existsSync } from "node:fs";

export const songRouter = new Elysia({ prefix: '/songs', tags: ['Songs'] })
    .get('', async ({ query }) => {
        const songs = await SongService.getAll({
            field: query.sortField,
            order: query.sortOrder
        })
        return { songs }
    }, { query: songQuerySchema, detail: {summary: 'Get songs'} })

    .get('/:id', async ({ params, headers }) => {
        const songFile = await SongService.getSongFileById(params.id)
        return streamFile(songFile, headers.range)
    }, { headers: RangeHeaderSchema, detail: {summary: 'Get song file'} })

    .get('/:id/cover', async ({ params, headers }) => {
        const filepath = await SongService.getCoverPathBySongId(params.id)
        return coverResponse(filepath, headers['if-none-match'])
    }, { headers: coverHeadersSchema, detail: {summary: 'Get song cover'} })

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