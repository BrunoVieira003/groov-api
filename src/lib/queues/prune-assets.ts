import { Bunqueue } from "bunqueue/client";
import path from "node:path";
import { db } from "../../database";
import { albums, songs } from "../../database/schema";
import { eq } from "drizzle-orm";
import { imagesDir } from "../../constants";
import fs from 'node:fs/promises'

export const pruneAssetsQueue = new Bunqueue<{filenames: string[]}>('prune-assets', {
    embedded: true,
    processor: async (job) => {
        const { filenames } = job.data
        
        let count = 0
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

            count++
            await job.updateProgress((count / filenames.length) * 100)
        }
    }
})

pruneAssetsQueue.on('active', (job) => {
    console.log(`Checking ${job.data.filenames.length} files for pruning...`)
})

pruneAssetsQueue.on('failed', (job) => {
    console.log(`Checking failed`)
})

pruneAssetsQueue.on('completed', (job) => {
    console.log(`Checking completed`)
})