import { eq, ilike } from "drizzle-orm"
import { db } from "../database"
import { artists } from "../database/schema"
import { NotFoundError } from "elysia"

interface SortOptions{
    field: keyof typeof artists.$inferSelect,
    order: 'asc' | 'desc'
}

export default class ArtistService{
    static async getAll(sort: SortOptions){
        const artists = await db.query.artists.findMany({
            orderBy: (artists, order) => order[sort.order](artists[sort.field])
        })
        return artists
    }

    static async getById(id: string){
        const artist = await db.query.artists.findFirst({
            where: eq(artists.id, id),
            with: {
                albums: {
                    columns: {
                        artistId: false
                    }
                },
                songs: {
                    columns: {},
                    with: {
                        song: {
                            columns: { filename: false },
                            with: {
                                album: true,
                                authors:  {
                                    columns: {},
                                    with: {
                                        artist: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        if(!artist){
            return new NotFoundError('Song not found')
        }

        const songs = artist.songs.map(s => {
            const song = s.song

            return {
                id: song.id,
                title: song.title,
                year: song.year,
                color: song.color,
                album: song.album,
                authors: song.authors.map(a => a.artist)
            }
        })

        const result = {
            id: artist.id,
            name: artist.name,
            albums: artist.albums,
            songs
        }

        return result
    }

    static async search(name: string){
        const artistList = await db.query.artists.findMany({ 
            where: ilike(artists.name, `%${name}%`),
        })
    
        const result = artistList.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
            }
        })
    
        return result
    }
}