import { Bunqueue } from "bunqueue/client";
import { db } from "../../database";
import { albums, songs } from "../../database/schema";
import { eq } from "drizzle-orm";

export const pruneAlbumsQueue = new Bunqueue('prune-albums', {
    embedded: true,
    processor: async (job) => {
        const storedAlbums = await db.query.albums.findMany({
            with: {
                songs: true
            }
        })

        for(let alb of storedAlbums){
            if(alb.songs.length === 0){
                await db
                    .delete(albums)
                    .where(eq(albums.id, alb.id))
                
                console.log('Album ', alb.title, `(${alb.id.slice(0,6)})`, 'removed')
            }
        }
        
    }
})

pruneAlbumsQueue.on('failed', (job) => {
    console.log(`Album pruning failed`)
})

pruneAlbumsQueue.on('completed', (job) => {
    console.log(`Album pruning completed`)
})