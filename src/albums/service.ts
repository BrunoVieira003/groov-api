import { eq } from "drizzle-orm"
import { db } from "../database"
import { albums, songs } from "../database/schema"
import { NotFoundError } from "elysia"

export class AlbumService{
    static async getAll(){
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

    static async getById(id: string){
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

        if(!album){
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