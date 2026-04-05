import { IPicture, parseFile } from "music-metadata"
import path from "node:path"
import { Job } from "bee-queue"
import { db } from "../../database"
import { albums, artists, songs, songsToArtists } from "../../database/schema"
import { filesDir, imagesDir } from "../../constants"
import {Vibrant} from 'node-vibrant/node'
import { and, eq } from "drizzle-orm"
import { existsSync } from "node:fs"

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
        
        const title = metadata.common.title || path.basename(filepath, path.extname(filepath))

        const picture = getPicture(metadata.common.picture)

        let prominentColor: string | null = null
        let contrastColor: string | null = null

        if(picture){
            const pallete = await Vibrant.from(Buffer.from(picture.data)).getPalette()
            if(pallete.Vibrant){
                prominentColor = pallete.Vibrant.hex
                contrastColor = pallete.Vibrant.bodyTextColor
            }
        }
        const song = (await db.insert(songs)
            .values({
                title,
                filename,
                year: metadata.common.year,
                coverArtFormat: getPictureFormat(picture),
                color: prominentColor,
                contrastColor: contrastColor
            })
            .onConflictDoUpdate({
                target: songs.filename,
                set: {
                    title,
                    year: metadata.common.year,
                    coverArtFormat: getPictureFormat(picture),
                    color: prominentColor,
                    contrastColor: contrastColor,
                }
            })
            .returning())[0]

        if(picture){
            const picturePath = path.join(imagesDir, `${song.id}.${picture.format.split('/')[1]}`)
            await Bun.write(picturePath, picture.data)
        }
            
        const artistsTag = metadata.common.artists
        const insertedArtists: {id: string, name: string}[] = []
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
            
            insertedArtists.push(artist)
        }

        const albumName = metadata.common.album
            const albumArtistName = metadata.common.albumartist
            let albumArtist: typeof artists.$inferSelect | undefined = undefined
            let album: typeof albums.$inferSelect
            if(albumName){
                if(albumArtistName){
                    albumArtist = (await db.insert(artists)
                        .values({ name: albumArtistName })
                        .onConflictDoNothing()
                        .returning())[0]
                }
                console.log()
                const storedAlbum = await db.query.albums.findFirst({where: and(
                    eq(albums.title, albumName),
                    eq(albums.artistId, albumArtist ? albumArtist.id : insertedArtists[0].id)
                )})
        
                if(!storedAlbum){
                    const [newAlbum] = await db.insert(albums)
                        .values({
                            title: albumName,
                            artistId: albumArtist ? albumArtist.id : insertedArtists[0].id
                        })
                        .returning()
                        .execute()
                    
                    album = newAlbum
                }else{
                    album = storedAlbum
                }
        
                await db.update(songs)
                    .set({albumId: album.id})
                    .where(eq(songs.id, song.id))
                    .execute()
                
                if(picture){
                    const picturePath = path.join(imagesDir, 'album', `${album.id}.${picture.format.split('/')[1]}`)
                    if(!existsSync(picturePath)){
                        await Bun.write(picturePath, picture.data)
                        await db.update(albums)
                            .set({
                                ...album,
                                coverArtFormat: getPictureFormat(picture)
                            })
                            .where(eq(albums.id, album.id))
                            .execute()
                    }
                }

        job.reportProgress({ status: 'running', progress: ((filenames.findIndex(f => f === filename) + 1) / filenames.length) * 100 })
    }
}

}