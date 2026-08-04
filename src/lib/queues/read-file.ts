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

async function processCover(cover: IPicture, songId: string, albumId?: string){   
    const picturePath = path.join(imagesDir, `${songId}.webp`)
    await new Bun.Image(cover.data)
    .webp({lossless: true})
    .write(picturePath)
        
    let prominentColor: string | null = null
    let contrastColor: string | null = null
    
    const pallete = await Vibrant.from(Buffer.from(cover.data)).getPalette()
    
    if (pallete.Vibrant) {
        prominentColor = pallete.Vibrant.hex
        contrastColor = pallete.Vibrant.bodyTextColor
        
        await db
        .update(songs)
        .set({
            color: prominentColor,
            contrastColor: contrastColor
        })
        .where(eq(songs.id, songId))
    }
}

function normalizeArtists(...artists: string[]){
    if(!artists || artists.length === 0){
        return []
    }

    artists = artists.filter(a => !a.includes('< ARTIST >'))

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
    normalizedArtists = normalizedArtists.filter(v => v !== '')
    return Array.from(new Set(normalizedArtists))
}

async function saveSong(filename: string, title: string, year: number | null = null, duration: number | null = null){
    const song = await db.query.songs.findFirst({where: eq(songs.filename, filename)})
    if(song){
        song.title = title,
        song.year = year,
        song.duration = duration

        await db
        .update(songs)
        .set(song)
        .where(eq(songs.id, song.id))

        return song
    }

    const [newSong] = await db
        .insert(songs)
        .values({
            filename,
            title,
            duration,
            year
        })
        .returning()
    
    return newSong
}

async function saveArtists(...songArtists: string[]){
    console.log("artists before", songArtists)
    
    songArtists = normalizeArtists(...songArtists)
    
    console.log("artists after", songArtists)

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

        insertedArtists.push(artist)
    }

    return insertedArtists
}

async function saveAlbum(title: string, albumArtistId: string){
    console.log('artista do album', albumArtistId)
    let album = await db.query.albums.findFirst({where: and(eq(albums.title, title))})
    console.log('album encontrado', album?.id, album?.artistId)
    if(!album){
        console.log('album nao existia');
        album = await db
            .insert(albums)
            .values({
                title,
                artistId: albumArtistId
            })
            .onConflictDoNothing()
    }else if(album && !album.artistId){
        console.log('album sem dono');

        const [updatedAlbum] = await db
            .update(albums)
            .set({artistId: albumArtistId})
            .where(eq(albums.id, album.id))
            .returning()
        
        album = updatedAlbum
    }
        
    return album
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
        const year = metadata.common.year
        
        const song = await saveSong(filename, title, year, duration)
        
        const songArtists = await saveArtists(metadata.common.artist || '', ...metadata.common.artists || [])
        
        for(let artist of songArtists){
            await db
                .insert(songsToArtists)
                .values({ songId: song.id, artistId: artist.id })
                .onConflictDoNothing()
        }

        if(metadata.common.album){
            const [albumArtist] = await saveArtists(metadata.common.albumartist || '', ...metadata.common.albumartists || [])
            const album = await saveAlbum(metadata.common.album, albumArtist.id)
            await db.update(songs)
                .set({ albumId: album.id })
                .where(eq(songs.id, song.id))
                .execute()
            
            const picture = getPicture(metadata.common.picture)
            if(picture){
                const picturePath = path.join(imagesDir, 'album', `${album.id}.webp`)
                if (!existsSync(picturePath)) {
                    await new Bun.Image(picture.data)
                        .webp({lossless: true})
                        .write(picturePath)
                }
            }
        }

        const picture = getPicture(metadata.common.picture)
        if(picture){
            await processCover(picture, song.id, metadata.common.album)
        }
    }
}
)

readFileQueue.on('active', (job) => {
    console.log(`Reading ${job.data.filename}...`)
})

readFileQueue.on('failed', (job, error) => {
    console.log(`Reading ${job.data.filename} failed. ${error.message}`)
})

readFileQueue.on('completed', (job) => {
    console.log(`${job.data.filename} successfully read`)
})