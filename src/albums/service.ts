import { and, eq, ilike, sql } from "drizzle-orm"
import { db } from "../database"
import { albums, artists, songs, songsToArtists } from "../database/schema"
import { file, NotFoundError } from "elysia"
import path from "node:path"
import fs from "node:fs"
import { imagesDir } from "../constants"
import { SortOptions } from "../types"

type AlbumSortOptions = SortOptions<typeof albums>

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
    
    static async getAll(sort: AlbumSortOptions) {
        const albumList = await db.query.albums.findMany({
            columns: {
                artistId: false
            },
            with: {
                artist: true
            },
            orderBy: (albums, order) => order[sort.order](albums[sort.field])
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
                        album: true,
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

    static async getFeaturedArtists(id: string){
        const featArtists = await db
            .select({
                id: artists.id,
                name: artists.name
            })
            .from(artists)
            .innerJoin(songsToArtists, eq(artists.id, songsToArtists.artistId))
            .innerJoin(songs, eq(songsToArtists.songId, songs.id))
            .where(eq(songs.albumId, id))
            .groupBy(artists.id)
        
        return featArtists
    }

    static async search(title: string){
        const albumList = await db.query.albums.findMany({ 
            where: ilike(albums.title, `%${title}%`),
        })
    
        const result = albumList.map((album) => {
            return {
                id: album.id,
                title: album.title,
            }
        })
    
        return result
    }
}