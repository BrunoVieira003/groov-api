import Elysia from "elysia";
import SongService from "./service";
import { uploadBodySchema } from "./schema";
import readFileQueue from "../lib/queues/read-file";
import { write } from "bun";
import path from "node:path"
import { filesDir } from "../constants";

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
    .post('/upload', async ({ body }) => {
        const file = body.file
        const filename = body.file.name

        const filepath = path.join(filesDir, filename)
        await write(filepath, file)

        const job = await readFileQueue.createJob({ filename }).save()

        return { jobId:  job.id}
    }, { body: uploadBodySchema })