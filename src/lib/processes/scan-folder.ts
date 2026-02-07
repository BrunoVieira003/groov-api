import { IPicture, parseFile } from "music-metadata"
import path from "node:path"
import { Job } from "bee-queue"
import { db } from "../../database"
import { artists, songs, songsToArtists } from "../../database/schema"
import { filesDir, imagesDir } from "../../constants"
import {Vibrant} from 'node-vibrant/node'

export interface ScanFolderData {
    filenames: string[]
}

function getPicture(picture: IPicture[] | undefined){
    if(picture && picture.length > 0){
        return picture[0]
    }
}

function getPictureFormat(picture: IPicture | undefined){
    if(picture){
        return picture.format.split('/')[1]
    }
}

export async function scanLocalFolder(job: Job<ScanFolderData>) {
    const { data } = job
    const { filenames } = data

    for (let filename of filenames) {
        console.log(filename)
        const filepath = path.join(filesDir, filename)
        
        const metadata = await parseFile(filepath)
        
        const title = metadata.common.title || filename

        const picture = getPicture(metadata.common.picture)

        let prominentColor: string | null = null

        if(picture){
            const pallete = await Vibrant.from(Buffer.from(picture.data)).getPalette()
            if(pallete.Vibrant){
                prominentColor = pallete.Vibrant.hex
            }
        }

        const song = (await db.insert(songs)
            .values({
                title,
                filename,
                year: metadata.common.year,
                coverArtFormat: getPictureFormat(picture),
                color: prominentColor,
            })
            .onConflictDoUpdate({
                target: songs.filename,
                set: {
                    title,
                    year: metadata.common.year,
                    coverArtFormat: getPictureFormat(picture)
                }
            })
            .returning())[0]

        if(picture){
            const picturePath = path.join(imagesDir, `${song.id}.${picture.format.split('/')[1]}`)
            await Bun.write(picturePath, picture.data)
        }
            
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