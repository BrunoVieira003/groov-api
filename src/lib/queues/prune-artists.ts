import { Bunqueue } from "bunqueue/client";
import { db } from "../../database";
import { albums, artists, songs } from "../../database/schema";
import { eq } from "drizzle-orm";

export const pruneArtistsQueue = new Bunqueue('prune-artists', {
    embedded: true,
    processor: async (job) => {
        const storedArtists = await db.query.artists.findMany({
            with: {
                songs: {
                    with: {
                        song: true
                    }
                }
            }
        })

        for(let art of storedArtists){
            if(art.songs.length === 0){
                await db
                    .delete(artists)
                    .where(eq(artists.id, art.id))
                
                console.log('Artist ', art.name, `(${art.id.slice(0,6)})`, 'removed')
            }
        }
        
    }
})

pruneArtistsQueue.on('failed', (job) => {
    console.log(`Checking failed`)
})

pruneArtistsQueue.on('completed', (job) => {
    console.log(`Checking completed`)
})