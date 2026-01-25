import { parseFile } from "music-metadata"
import path from "node:path"
import { Job } from "bee-queue"
import { db } from "../../database"
import { artists, songs, songsToArtists } from "../../database/schema"
import { filesDir } from "../../constants"
import { and, eq } from "drizzle-orm"

export interface ScanFileData {
    filenames: string[]
}

export async function scanLocalFolder(job: Job<ScanFileData>) {
    const { data } = job
    const { filenames } = data

    for(let filename of filenames){
        const filepath = path.join(filesDir, filename)

        const metadata = await parseFile(filepath)
    
        const title = metadata.common.title || filename
    
        let song = await db.query.songs.findFirst({ where: eq(songs.filename, filename), with: { authors: true } })
        if (!song) {
            const newSong = (await db.insert(songs).values({
                title,
                filename,
                year: metadata.common.year
            }).returning())[0]
    
            song = { ...newSong, authors: [] }
        }
    
        const artistsTag = metadata.common.artists
        if (artistsTag) {
            for (let art of artistsTag) {
                let artist = await db.query.artists.findFirst({ where: eq(artists.name, art) })
                if (!artist) {
                    const newArtist = (await db.insert(artists).values({ name: art }).returning())[0]
                    artist = newArtist
                }
    
                const songArtistRelation = await db.query.songsToArtists.findFirst({
                    where: and(
                        eq(songsToArtists.songId, song.id),
                        eq(songsToArtists.artistId, artist.id)
                    )
                })
    
                if (!songArtistRelation) {
                    await db.insert(songsToArtists).values({ songId: song.id, artistId: artist.id })
                }
            }
        }
        
        job.reportProgress({current: ((filenames.findIndex(f => f === filename) + 1) / filenames.length) * 100})
    }

}