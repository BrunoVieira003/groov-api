import { and, eq, ilike } from "drizzle-orm";
import { db } from "../../database";
import { playlists, songs, songsToPlaylists } from "../../database/schema";
import { file, NotFoundError } from "elysia";
import { existsSync } from 'fs'
import path from "path";
import fs from "node:fs"
import { imagesDir } from "../../lib/constants";

interface UpdatePlaylist {
    title?: string
}


export class PlaylistService {
    static async create(title: string) {
        const [playlist] = await db.insert(playlists).values({
            title
        }).returning()

        return playlist
    }

    static async getAll() {
        const playlistList = await db.query.playlists.findMany({})

        return playlistList
    }

    static async getById(id: string) {
        const playlist = await db.query.playlists.findFirst({
            where: eq(playlists.id, id),
            with: {
                songs: {
                    orderBy: ({trackNumber}, { asc }) => [asc(trackNumber)],
                    with: {
                        song: {
                            columns: {
                                createdAt: false,
                                updatedAt: false,
                                albumId: false
                            },
                            with: {
                                authors: {
                                    columns: {},
                                    with: { artist: true }
                                },
                                album: true
                            }
                        }
                    },
                    columns: {
                        id: true,
                        trackNumber: true,
                    }
                }
            }
        })

        if (!playlist) {
            throw new NotFoundError('Playlist not found')
        }

        const result = {
            id: playlist.id,
            title: playlist.title,
            songs: playlist.songs.map(son => ({ ...son.song, trackNumber: son.trackNumber, relationId: son.id, authors: son.song.authors.map(aut => aut.artist) }))
        }

        return result
    }

    static async getCoverByPlaylistId(id: string) {
        const playlist = await db.query.artists.findFirst({ where: eq(playlists.id, id) })
        if (!playlist) {
            throw new NotFoundError('Playlist not found')
        }

        const filepath = path.join(imagesDir, 'playlist', `${playlist.id}.webp`)
        if (!fs.existsSync(filepath)) {
            throw new NotFoundError('Cover art file not found')
        }

        return file(filepath)
    }

    static async update(playlistId: string, data: UpdatePlaylist) {
        const playlist = await this.getById(playlistId)

        await db.update(playlists)
        .set({
            title: data.title ?? playlist.title
        })
        .where(eq(playlists.id, playlistId))
    }

    static async delete(playlistId: string) {
        const playlist = await this.getById(playlistId)

        await db.delete(playlists).where(eq(playlists.id, playlistId))
    }

    static async addSong(playlistId: string, songId: string) {
        const playlist = await this.getById(playlistId)

        const song = await db.query.songs.findFirst({ where: eq(songs.id, songId) })
        if (!song) {
            throw new NotFoundError('Song not found')
        }

        let nextTrackNumber = Math.max(...playlist.songs.map(s => s.trackNumber || -1), 0) + 1
        console.log(nextTrackNumber)
        await db.insert(songsToPlaylists).values({
            playlistId,
            songId,
            trackNumber: nextTrackNumber
        })

        const songCoverFilepath = path.join(imagesDir, 'song', `${songId}.webp`)
        if (existsSync(songCoverFilepath)) {
            const playlistsCoverFilepath = path.join(imagesDir, 'playlist', `${playlistId}.webp`)
            if (!existsSync(playlistsCoverFilepath)) {
                const file = Bun.file(songCoverFilepath);
                await Bun.write(playlistsCoverFilepath, file);
            }
        }
    }

    static async removeSong(playlistId: string, relationId: string) {
        await db.delete(songsToPlaylists).where(and(
            eq(songsToPlaylists.playlistId, playlistId),
            eq(songsToPlaylists.id, relationId)
            )
        )
        const playlist = await this.getById(playlistId)

        let nextTrackNumber = 1
        for(let song of playlist.songs){
            await db.update(songsToPlaylists)
                .set({trackNumber: nextTrackNumber})
                .where(eq(songsToPlaylists.id, song.relationId))
                .execute()


            nextTrackNumber += 1
        }

    }

    static async search(title: string) {
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

    static async changeCover(playlistId: string, file: File) {
        await this.getById(playlistId)

        const playlistsCoverFilepath = path.join(imagesDir, 'playlist', `${playlistId}.webp`)
        await new Bun.Image(file)
            .webp({ lossless: true })
            .write(playlistsCoverFilepath)
    }

    static async reorder(playlistId: string, relationIds: string[]){
        await this.getById(playlistId)

        let trackNumber = 1
        for(let id of relationIds){
            await db
            .update(songsToPlaylists)
            .set({
                trackNumber
            })
            .where(eq(songsToPlaylists.id, id))

            trackNumber++
        }
    }
}