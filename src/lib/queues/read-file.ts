import { Bunqueue } from "bunqueue/client";
import { filesDir, imagesDir } from "../constants";
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
    filename: string,
    deep?: boolean
}

type ImageCategory = 'song' | 'album' | 'artist'

function getPicture(picture: IPicture[] | undefined) {
    if (picture && picture.length > 0) {
        return picture[0]
    }
}

async function saveImage(cover: IPicture, id: string, category: ImageCategory, override: boolean = true) {
    const picturePath = path.join(imagesDir, category, `${id}.webp`)
    const shouldSave = override || !existsSync(picturePath)

    if (!shouldSave) return;

    await new Bun.Image(cover.data)
        .webp({ lossless: true })
        .write(picturePath)

}

async function updatePallete(cover: IPicture, songId: string) {
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

function normalizeArtists(...artists: string[]) {
    if (!artists || artists.length === 0) {
        return []
    }

    artists = artists.filter(a => !a.includes('< ARTIST >'))

    let normalizedArtists: string[] = []

    for (let art of artists) {
        let parsedArtists = new Set<string>()
        if (artistExactWhitelist.includes(art)) {
            parsedArtists.add(art.trim())
            normalizedArtists.push(...parsedArtists)
            continue
        }

        let divided = false
        for (let divider of dividers) {
            if (art.includes(divider)) {
                const splitArtists = art.split(divider)
                splitArtists.forEach(a => parsedArtists.add(a.trim()))
                divided = true
                break
            }
        }

        if (!divided) {
            parsedArtists.add(art.trim())
        }

        normalizedArtists.push(...parsedArtists)
    }

    for (let [tag, subset] of Object.entries(artistCompositeWhitelist)) {
        if (subset.every(v => normalizedArtists.includes(v))) {
            normalizedArtists = normalizedArtists.filter(v => !subset.includes(v.toUpperCase()))
            normalizedArtists = [tag, ...normalizedArtists]
        }
    }
    normalizedArtists = normalizedArtists.filter(v => v !== '')
    return Array.from(new Set(normalizedArtists))
}

async function saveSong(filename: string, title: string, year: number | null = null, duration: number | null = null, hash: string) {
    const song = await db.query.songs.findFirst({ where: eq(songs.filename, filename) })
    if (song) {
        song.title = title,
            song.year = year,
            song.duration = duration
        song.fingerprint = hash

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
            year,
            fingerprint: hash
        })
        .returning()

    return newSong
}

async function saveArtists(...songArtists: string[]) {
    songArtists = normalizeArtists(...songArtists)

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

async function saveAlbum(title: string) {
    let album = await db.query.albums.findFirst({ where: and(eq(albums.title, title)) })
    if (!album) {
        album = await db
            .insert(albums)
            .values({
                title,
            })
            .onConflictDoNothing()
    }

    return album
}

async function addAlbumArtist(albumId: string, albumArtistId: string) {
    await db
        .update(albums)
        .set({ artistId: albumArtistId })
        .where(eq(albums.id, albumId))
        .returning()
}

export async function checkFingerprint(filename: string) {
    const filepath = path.join(filesDir, filename)
    const buffer = await Bun.file(filepath).arrayBuffer()

    const hash = Bun.hash(buffer, 1234)
    const song = await db.query.songs.findFirst({ where: and(eq(songs.filename, filename), eq(songs.fingerprint, String(hash))) })
    if (!song) {
        return { fingerprint: String(hash), needsUpdate: true }
    }

    return { fingerprint: String(hash), needsUpdate: false }
}

export const readFileQueue = new Bunqueue<ReadFileJobData>('read-file', {
    embedded: true,
    concurrency: 1,
    processor: async (job) => {
        const { filename, deep } = job.data
        const filepath = path.join(filesDir, filename)

        const checking = await checkFingerprint(filename)
        if (!deep && !checking.needsUpdate) {
            console.log(`No changes detected on ${filename}. Skipping...`)
            return
        }

        const metadata = await parseFile(filepath, { duration: true });

        const title = metadata.common.title || path.basename(filepath, path.extname(filepath))
        const duration = metadata.format.duration
        const year = metadata.common.year

        const song = await saveSong(filename, title, year, duration, checking.fingerprint)
        console.log('- Title', title)
        console.log('- Duration', duration)
        console.log('- Year', year)

        const songArtists = await saveArtists(metadata.common.artist || '', ...metadata.common.artists || [])
        console.log("- Artists", songArtists.map(a => a.name))

        for (let artist of songArtists) {
            await db
                .insert(songsToArtists)
                .values({ songId: song.id, artistId: artist.id })
                .onConflictDoNothing()
        }

        if (metadata.common.album) {
            const album = await saveAlbum(metadata.common.album)
            console.log('- Album', album.title)

            const albumArtists = await saveArtists(metadata.common.albumartist || '', ...metadata.common.albumartists || [])
            if (albumArtists.length > 0) {
                console.log('- Alb. Artists', albumArtists.map(a => a.name))

                await addAlbumArtist(album.id, albumArtists[0].id)
                await db.update(songs)
                    .set({ albumId: album.id })
                    .where(eq(songs.id, song.id))
                    .execute()

                const picture = getPicture(metadata.common.picture)
                if (picture) {
                    await saveImage(picture, album.id, 'album', false)
                }
            }
        }

        const picture = getPicture(metadata.common.picture)
        if (picture) {
            await saveImage(picture, song.id, 'song')
            await updatePallete(picture, song.id)
            for (let art of songArtists) {
                await saveImage(picture, art.id, 'artist')
            }
        }
    }
}
)

readFileQueue.on('active', (job) => {
    console.group(job.data.filename)
})

readFileQueue.on('failed', (job, error) => {
    console.log(`Reading ${job.data.filename} failed. ${error.message}`)
    console.groupEnd()
})

readFileQueue.on('completed', (job) => {
    console.log(`${job.data.filename} successfully read`)
    console.groupEnd()
})