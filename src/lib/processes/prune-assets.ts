import { Job } from "bee-queue";
import { db } from "../../database";
import { albums, songs } from "../../database/schema";
import path from "node:path"
import fs from "node:fs/promises"
import { eq } from "drizzle-orm";
import { imagesDir } from "../../constants";

export interface PruneAssetsData {
    filenames: string[]
}

export async function pruneAssets(job: Job<PruneAssetsData>){
    const { data } = job
    const { filenames } = data

    for(let filename of filenames){
        if(filename.includes('album')){
            const albumId = path.basename(filename, path.extname(filename))
            const album = await db.query.albums.findFirst({
                where: eq(albums.id, albumId)
            })

            if(!album){
                const filepath = path.join(imagesDir, filename)
                await fs.unlink(filepath)
                console.log('File', filename, 'removed')
            }
        }else{
            const songId = path.basename(filename, path.extname(filename))
            const song = await db.query.songs.findFirst({
                where: eq(songs.id, songId)
            })
            
            if(!song){
                const filepath = path.join(imagesDir, filename)
                await fs.unlink(filepath)
                console.log('File', filename, 'removed')
            }
        }

        job.reportProgress({ status: 'running', progress: ((filenames.findIndex(f => f === filename) + 1) / filenames.length) * 100 })
    }
}