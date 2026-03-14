import { Job } from "bee-queue";
import { filesDir } from "../../constants";
import path from "node:path"
import fs from "node:fs"
import { db } from "../../database";
import { songs } from "../../database/schema";
import { eq } from "drizzle-orm";

export interface PruneSongsData {
    filenames: string[]
}

export async function pruneSongs(job: Job<PruneSongsData>){
    const { data } = job
    const { filenames } = data

    for(let filename of filenames){
        const filepath = path.join(filesDir, filename)

        if(!fs.existsSync(filepath)){
            await db.delete(songs).where(eq(songs.filename, filename)).execute()
        }

        job.reportProgress({ status: 'running', progress: ((filenames.findIndex(f => f === filename) + 1) / filenames.length) * 100 })
    }
    
}