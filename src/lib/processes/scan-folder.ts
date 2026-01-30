import { parseFile } from "music-metadata"
import path from "node:path"
import { Job } from "bee-queue"
import { db } from "../../database"
import { artists, songs, songsToArtists } from "../../database/schema"
import { filesDir } from "../../constants"

export interface ScanFolderData {
    filenames: string[]
}

export async function scanLocalFolder(job: Job<ScanFolderData>) {
    const { data } = job
    const { filenames } = data

    for (let filename of filenames) {
        const filepath = path.join(filesDir, filename)
        
        const metadata = await parseFile(filepath)
        
        const title = metadata.common.title || filename
        
        const song = (await db.insert(songs)
            .values({
                title,
                filename,
                year: metadata.common.year
            })
            .onConflictDoUpdate({
                target: songs.filename,
                set: {
                    title,
                    year: metadata.common.year
                }
            })
            .returning())[0]

        const artistsTag = metadata.common.artists
        for (let art of artistsTag || []) {
            const artist = (await db.insert(artists)
                .values({ name: art })
                .onConflictDoUpdate({
                    target: artists.name,
                    set: {
                        name: art
                    }
                })
                .returning())[0]

            await db.insert(songsToArtists)
                .values({ songId: song.id, artistId: artist.id })
                .onConflictDoNothing()
        }

        job.reportProgress({ status: 'in-progress', progress: ((filenames.findIndex(f => f === filename) + 1) / filenames.length) * 100 })
    }

}