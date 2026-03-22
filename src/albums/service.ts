import { eq } from "drizzle-orm"
import { db } from "../database"
import { albums, songs } from "../database/schema"
import { file, NotFoundError } from "elysia"
import path from "node:path"
import fs from "node:fs"
import { imagesDir } from "../constants"

export class AlbumService {
    static async getCoverByAlbumId(id: string) {
        const album = await db.query.albums.findFirst({ where: eq(albums.id, id) })
        if (!album) {
            throw new NotFoundError('Album not found')
        }

        const filepath = path.join(imagesDir, 'album', `${album.id}.${album.coverArtFormat}`)
        if (!fs.existsSync(filepath)) {
            throw new NotFoundError('Cover art file not found')
        }

        return file(filepath)
    }
    
    static async getAll() {
        const albumList = await db.query.albums.findMany({
            columns: {
                artistId: false
            },
            with: {
                artist: true
            }
        })

        return albumList
    }

    static async getById(id: string) {
        const album = await db.query.albums.findFirst({
            columns: {
                artistId: false
            },
            where: eq(albums.id, id),
            with: {
                artist: true,
                songs: {
                    columns: {
                        albumId: false
                    },
                    with: {
                        authors: {
                            columns: {},
                            with: {
                                artist: true
                            }
                        }
                    }
                }
            }
        })

        if (!album) {
            throw new NotFoundError('Album not found')
        }

        return {
            ...album,
            songs: album.songs.map(song => {
                return {
                    ...song,
                    authors: song.authors.map(aut => aut.artist)
                }
            })
        }
    }
}