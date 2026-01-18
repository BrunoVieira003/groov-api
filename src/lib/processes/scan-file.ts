import { parseFile } from "music-metadata"
import path from "node:path"
import { Job } from "bee-queue"
import { db } from "../../database"
import { artists, songs, songsToArtists } from "../../database/schema"
import { filesDir } from "../../constants"
import { eq } from "drizzle-orm"

export interface ScanFileData {
    filename: string
}

function parseArtistTag(artistTag: string): string[]{
    const artistNames = artistTag.split(',')
    return artistNames.map(art => art.trim())
}

export async function scanLocalFile(job: Job<ScanFileData>) {
    const { data } = job
    const { filename } = data

    const filepath = path.join(filesDir, filename)

    const metadata = await parseFile(filepath)

    const title = metadata.common.title || filename

    const insertedSong = (await db.insert(songs).values({
        title,
        filename,
        year: metadata.common.year
    }).returning())[0]

    const artistTag = metadata.common.artist
    if(artistTag){
        const artistNames = parseArtistTag(artistTag)
        for(let art of artistNames){
            const storedArtist = await db.query.artists.findFirst({where: eq(artists.name, art)})
            if(storedArtist){
                await db.insert(songsToArtists).values({songId: insertedSong.id, artistId: storedArtist.id})
            }else{
                const newArtist = (await db.insert(artists).values({name: art}).returning())[0]
                await db.insert(songsToArtists).values({songId: insertedSong.id, artistId: newArtist.id})
            }
        }
    }
}