import { Bunqueue } from "bunqueue/client";
import { Workflow } from "bunqueue/workflow";
import { filesDir, imagesDir } from "../../constants";
import { IPicture, parseFile } from "music-metadata";
import path from 'node:path'
import { Vibrant } from "node-vibrant/node";
import { albums, artists, songs, songsToArtists } from "../../database/schema";
import { db } from "../../database";
import { and, eq } from "drizzle-orm";
import { existsSync } from "node:fs";

export interface ReadFileJobData {
    filename: string
}

function getPicture(picture: IPicture[] | undefined) {
    if (picture && picture.length > 0) {
        return picture[0]
    }
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

        const metadata = await parseFile(filepath);
        await job.updateProgress(10, 'Metadata read')

        const title = metadata.common.title || path.basename(filepath, path.extname(filepath))

        const picture = getPicture(metadata.common.picture)

        let prominentColor: string | null = null
        let contrastColor: string | null = null

        if (picture) {
            const pallete = await Vibrant.from(Buffer.from(picture.data)).getPalette()
            if (pallete.Vibrant) {
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

        if (picture) {
            const picturePath = path.join(imagesDir, `${song.id}.${picture.format.split('/')[1]}`)
            await Bun.write(picturePath, picture.data)
        }

        const artistsTag = metadata.common.artists
        const insertedArtists: { id: string, name: string }[] = []
        for (let art of artistsTag || []) {
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
        const albumArtistName = metadata.common.albumartist
        let albumArtist: typeof artists.$inferSelect | undefined = undefined
        let album: typeof albums.$inferSelect
        if (albumName) {
            if (albumArtistName) {
                albumArtist = (await db.insert(artists)
                    .values({ name: albumArtistName })
                    .onConflictDoNothing()
                    .returning())[0]
            }

            const storedAlbum = await db.query.albums.findFirst({
                where: and(
                    eq(albums.title, albumName),
                    eq(albums.artistId, albumArtist ? albumArtist.id : insertedArtists[0].id)
                )
            })

            if (!storedAlbum) {
                const [newAlbum] = await db.insert(albums)
                    .values({
                        title: albumName,
                        artistId: albumArtist ? albumArtist.id : insertedArtists[0].id
                    })
                    .returning()
                    .execute()

                album = newAlbum
            } else {
                album = storedAlbum
            }

            await db.update(songs)
                .set({ albumId: album.id })
                .where(eq(songs.id, song.id))
                .execute()

            if (picture) {
                const picturePath = path.join(imagesDir, 'album', `${album.id}.${picture.format.split('/')[1]}`)
                if (!existsSync(picturePath)) {
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
        }
    }
})

readFileQueue.on('active', (job) => {
    console.log(`Reading ${job.data.filename}...`)
})

readFileQueue.on('failed', (job) => {
    console.log(`Reading ${job.data.filename} failed`)
})

readFileQueue.on('completed', (job) => {
    console.log(`${job.data.filename} successfully read`)
})