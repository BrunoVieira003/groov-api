import { and, eq } from "drizzle-orm";
import { db } from "../database";
import { playlists, songs, songsToPlaylists } from "../database/schema";
import { NotFoundError } from "elysia";

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
                                coverArtFormat: false
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
            songs: playlist.songs.map(son => son.song)
        }

        return result
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
}