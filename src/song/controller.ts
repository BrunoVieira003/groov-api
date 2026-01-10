import Elysia, { NotFoundError } from "elysia";
import fs, { statSync } from 'node:fs';
import path from 'node:path';
import scanFolderQueue from "../lib/queues/scan-folder";
import { db } from "../database";
import { filesDir } from "../constants";
import { eq } from "drizzle-orm";
import { songs } from "../database/schema";
import { file } from "bun";

export const songRouter = new Elysia({prefix: '/song'})
    .get('', async () => {
        const songs = await db.query.songs.findMany()
        return {songs}
    })
    .get('/scan', async () => {
        const filenames = fs.readdirSync(filesDir)
        for(let f of filenames){
            await scanFolderQueue.createJob({filename: f}).save()
        }

        return {detectedFiles: filenames.length}
    })
    .get('/:id', async ({params, set}) => {
        const song = await db.query.songs.findFirst({where: eq(songs.id, params.id)})
        if(!song){
            return new NotFoundError('Song not found')
        }

        const filepath = path.join(filesDir, song.filename)

        if(!fs.existsSync(filepath)){
            return new NotFoundError('Song not found')
        }

        set.headers["content-type"] = "audio/mpeg"
        set.headers["accept-ranges"] = "bytes"

        const songFile = file(filepath)
        
        return songFile

    })
    .get('/:id/stat', async ({params}) => {
        const song = await db.query.songs.findFirst({
            where: eq(songs.id, params.id),
            columns: {
                filename: false
            }
        })

        return { song }
    })