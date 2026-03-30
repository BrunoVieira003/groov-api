import { and, eq, ilike } from "drizzle-orm";
import { db } from "../database";
import { playlists, songs, songsToPlaylists } from "../database/schema";
import { NotFoundError } from "elysia";

interface UpdatePlaylist{
    title?: string
}


export class PlaylistService{
    static async create(title: string){
        const [playlist] = await db.insert(playlists).values({
            title
        }).returning()

        return playlist
    }

    static async getAll(){
        const playlistList = await db.query.playlists.findMany({})

        return playlistList
    }

    static async getById(id: string){
        const playlist = await db.query.playlists.findFirst({
            where: eq(playlists.id, id),
            with: {
                songs: {
                    with: {
                        song: {
                            columns: {
                                createdAt: false,
                                updatedAt: false,
                                coverArtFormat: false,
                                albumId: false
                            },
                            with: {
                                authors: {
                                    columns: {},
                                    with: {artist: true}
                                },
                                album: true
                            }
                        }
                    },
                    columns: {} 
                }
            }
        })

        if(!playlist){
            throw new NotFoundError('Playlist not found')
        }

        const result = {
            id: playlist.id,
            title: playlist.title,
            songs: playlist.songs.map(son => ({...son.song, authors: son.song.authors.map(aut => aut.artist)}))
        }

        return result
    }

    static async update(playlistId: string, data: UpdatePlaylist){
        const playlist = await this.getById(playlistId)
        if(data.title){
            playlist.title = data.title
        }

        await db.update(playlists).set(playlist)
    }

    static async delete(playlistId: string){
        const playlist = await this.getById(playlistId)

        await db.delete(playlists).where(eq(playlists.id, playlistId))
    }

    static async addSong(playlistId: string, songId: string){
        await db.insert(songsToPlaylists).values({
            playlistId,
            songId
        })
    }

    static async removeSong(playlistId: string, songId: string){
        await db.delete(songsToPlaylists).where(and(
                eq(songsToPlaylists.playlistId, playlistId),
                eq(songsToPlaylists.songId, songId)
            )
        )
    }

    static async search(title: string){
        const playlistList = await db.query.playlists.findMany({ 
            where: ilike(playlists.title, `%${title}%`),
        })
    
        const result = playlistList.map((playlist) => {
            return {
                id: playlist.id,
                title: playlist.title,
            }
        })
    
        return result
    }
}