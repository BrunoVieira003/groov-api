import { Bunqueue } from "bunqueue/client";
import fs from 'node:fs'
import path from "node:path";
import { filesDir } from "../../constants";
import { db } from "../../database";
import { songs } from "../../database/schema";
import { eq } from "drizzle-orm";

export const pruneSongsQueue = new Bunqueue<{filenames: string[]}>('prune-songs', {
    embedded: true,
    processor: async (job) => {
        const { filenames } = job.data

        let count = 0
        for(let filename of filenames){
            const filepath = path.join(filesDir, filename)
    
            if(!fs.existsSync(filepath)){
                await db.delete(songs).where(eq(songs.filename, filename)).execute()
                console.log('Song bind to', filename, 'removed')
            }

            count++
            await job.updateProgress((count / filenames.length) * 100)
        }
    }
})


pruneSongsQueue.on('active', (job) => {
    console.log(`Checking ${job.data.filenames.length} files for pruning...`)
})

pruneSongsQueue.on('failed', (job) => {
    console.log(`Checking failed`)
})

pruneSongsQueue.on('completed', (job) => {
    console.log(`Checking completed`)
})