import { Vibrant } from "node-vibrant/node";
import { Job } from "bee-queue";
import { IPicture, parseFile } from "music-metadata";
import { db } from "../../database";
import { albums, artists, songs, songsToArtists } from "../../database/schema";
import path from "node:path"
import { filesDir, imagesDir } from "../../constants";
import { and, eq } from "drizzle-orm";

export interface ReadFileData {
    filename: string
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

export async function readFileData(job: Job<ReadFileData>){
    const { data } = job
    const { filename } = data
    
    const filepath = path.join(filesDir, filename)

    const metadata = await parseFile(filepath);

    const title = metadata.common.title || path.basename(filepath, path.extname(filepath))

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
    const insertedArtists: {id: string, name: string}[] = []
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
    if(albumName){
        if(albumArtistName){
            albumArtist = (await db.insert(artists)
                .values({ name: albumArtistName })
                .onConflictDoNothing()
                .returning())[0]
        }

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
    }


}