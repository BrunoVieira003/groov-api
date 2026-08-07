import { eq, ilike } from "drizzle-orm"
import { db } from "../../database"
import { artists } from "../../database/schema"
import { file, NotFoundError } from "elysia"
import { SortOptions } from "../../lib/types"
import path from "node:path"
import fs from "node:fs"
import { imagesDir } from "../../lib/constants"

type ArtistSortOptions = SortOptions<typeof artists>

export default class ArtistService {
    static async getAll(sort: ArtistSortOptions) {
        const artists = await db.query.artists.findMany({
            orderBy: (artists, order) => order[sort.order](artists[sort.field])
        })
        return artists
    }

    static async getById(id: string) {
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
                                authors: {
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
        if (!artist) {
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

    static async getCoverByArtistId(id: string) {
        const artist = await db.query.artists.findFirst({ where: eq(artists.id, id) })
        if (!artist) {
            throw new NotFoundError('Artist not found')
        }

        const filepath = path.join(imagesDir, 'artist', `${artist.id}.webp`)
        if (!fs.existsSync(filepath)) {
            throw new NotFoundError('Cover art file not found')
        }

        return file(filepath)
    }

    static async search(name: string) {
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