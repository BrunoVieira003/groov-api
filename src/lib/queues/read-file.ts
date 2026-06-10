import { Bunqueue } from "bunqueue/client";
import { filesDir, imagesDir } from "../../constants";
import { IPicture, parseFile } from "music-metadata";
import path from 'node:path'
import { Vibrant } from "node-vibrant/node";
import { albums, artists, songs, songsToArtists } from "../../database/schema";
import { db } from "../../database";
import { and, eq } from "drizzle-orm";
import { existsSync } from "node:fs";
import whitelist from '../artist-whitelist.yml'

const dividers = whitelist.artistDividers as string[]
const artistExactWhitelist = whitelist.artistExactMatch as string[]
const artistCompositeWhitelist = whitelist.artistCompositeMatch as Record<string, string[]>

export interface ReadFileJobData {
    filename: string
}

function getPicture(picture: IPicture[] | undefined) {
    if (picture && picture.length > 0) {
        return picture[0]
    }
}

function normalizeArtists(...artists: string[]){
    if(!artists || artists.length === 0){
        return []
    }

    let normalizedArtists: string[] = []

    for(let art of artists){
        let parsedArtists = new Set<string>()
        if(artistExactWhitelist.includes(art)){
            parsedArtists.add(art.trim())
            normalizedArtists.push(...parsedArtists)
            continue
        }
             
        let divided = false
        for(let divider of dividers){
            if(art.includes(divider)){
                const splitArtists = art.split(divider)
                splitArtists.forEach(a => parsedArtists.add(a.trim()))
                divided = true
                break
            }
        }

        if(!divided){
            parsedArtists.add(art.trim())
        }

        normalizedArtists.push(...parsedArtists)
    }

    for(let [tag, subset] of Object.entries(artistCompositeWhitelist)){
        if(subset.every(v => normalizedArtists.includes(v))){
            normalizedArtists = normalizedArtists.filter(v => !subset.includes(v.toUpperCase()))
            normalizedArtists = [tag, ...normalizedArtists]
        }
    }

    return normalizedArtists
}

function getPictureFormat(picture: IPicture | undefined) {
    if (picture) {
        return picture.format.split('/')[1]
    }
}

export const readFileQueue = new Bunqueue<ReadFileJobData>('read-file', {
    embedded: true,
    processor: async (job) => {
        const { filename } = job.data
        const filepath = path.join(filesDir, filename)

        const metadata = await parseFile(filepath, {duration: true});
        await job.updateProgress(10, 'Metadata read')

        const title = metadata.common.title || path.basename(filepath, path.extname(filepath))
        const duration = metadata.format.duration

        const picture = getPicture(metadata.common.picture)

        const [song] = (await db.insert(songs)
            .values({
                title,
                filename,
                year: metadata.common.year,
                duration,
                coverArtFormat: getPictureFormat(picture),
            })
            .onConflictDoUpdate({
                target: songs.filename,
                set: {
                    title,
                    year: metadata.common.year,
                    duration,
                    coverArtFormat: getPictureFormat(picture),
                }
            })
            .returning())

        if (picture) {
            const picturePath = path.join(imagesDir, `${song.id}.webp`)
            await new Bun.Image(picture.data)
                .webp({lossless: true})
                .write(picturePath)

            let prominentColor: string | null = null
            let contrastColor: string | null = null
            
            const pallete = await Vibrant.from(Buffer.from(picture.data)).getPalette()

            if (pallete.Vibrant) {
                prominentColor = pallete.Vibrant.hex
                contrastColor = pallete.Vibrant.bodyTextColor

                await db
                    .update(songs)
                    .set({
                        color: prominentColor,
                        contrastColor: contrastColor
                    })
                    .where(eq(songs.id, song.id))
            }
        }

        const songArtists = normalizeArtists(...metadata.common.artists || [], ...metadata.common.albumartists || [])
        console.log(songArtists)

        const insertedArtists: { id: string, name: string }[] = []
        for (let art of songArtists) {
            const [artist] = (await db.insert(artists)
                .values({ name: art })
                .onConflictDoUpdate({
                    target: artists.name,
                    set: {
                        name: art
                    }
                })
                .returning())

            await db.insert(songsToArtists)
                .values({ songId: song.id, artistId: artist.id })
                .onConflictDoNothing()

            insertedArtists.push(artist)
        }

        const albumName = metadata.common.album
        let album: typeof albums.$inferSelect
        if (albumName) {
            if (insertedArtists.length > 0){
                const storedAlbum = await db.query.albums.findFirst({
                    where: and(
                        eq(albums.title, albumName),
                        eq(albums.artistId, insertedArtists[0].id)
                    )
                })
    
                if (!storedAlbum) {
                    const [newAlbum] = await db.insert(albums)
                        .values({
                            title: albumName,
                            artistId: insertedArtists[0].id
                        })
                        .returning()
                        .execute()
    
                    album = newAlbum
                } else {
                    album = storedAlbum
                }
            }else{
                const [insertedArtist] = (await db.insert(artists)
                    .values({ name: 'unknown' })
                    .onConflictDoUpdate({
                        target: artists.name,
                        set: {
                            name: 'unknown'
                        }
                    })
                    .returning())
                
                const [newAlbum] = await db.insert(albums)
                    .values({
                        title: albumName,
                        artistId: insertedArtist.id
                    })
                    .returning()
                    .execute()

                album = newAlbum
            }


            await db.update(songs)
                .set({ albumId: album.id })
                .where(eq(songs.id, song.id))
                .execute()

            if (picture && album) {
                const picturePath = path.join(imagesDir, 'album', `${album.id}.webp`)
                if (!existsSync(picturePath)) {
                    await new Bun.Image(picture.data)
                        .webp({lossless: true})
                        .write(picturePath)

                    await db.update(albums)
                        .set({
                            ...album,
                            coverArtFormat: getPictureFormat(picture)
                        })
                        .where(eq(albums.id, album.id))
                        .execute()
                }
            }
        }
    }
})

readFileQueue.on('active', (job) => {
    console.log(`Reading ${job.data.filename}...`)
})

readFileQueue.on('failed', (job, error) => {
    console.log(`Reading ${job.data.filename} failed. ${error.message}`)
})

readFileQueue.on('completed', (job) => {
    console.log(`${job.data.filename} successfully read`)
})