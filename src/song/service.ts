import { file, NotFoundError } from "elysia";
import { db } from "../database";
import path from 'node:path';
import fs from 'node:fs';
import { eq, ilike } from "drizzle-orm";
import { albums, songs } from "../database/schema";
import { filesDir, imagesDir } from "../constants";
import { SortOptions } from "../types";

type SongSortOptions = SortOptions<typeof songs>

export default class SongService {
    static async getAll(sort: SongSortOptions) {
        const songList = await db.query.songs.findMany({
            with: {
                album: {
                    columns: {
                        artistId: false,
                        coverArtFormat: false,
                    }
                },
                authors: {
                    columns: {},
                    with: { artist: true }
                }
            },
            orderBy: (songs, order) => order[sort.order](songs[sort.field])
        })

        const result = songList.map((song) => {
            return {
                id: song.id,
                title: song.title,
                year: song.year,
                color: song.color,
                contrastColor: song.contrastColor,
                createdAt: song.createdAt,
                updatedAt: song.updatedAt,
                album: song.album,
                authors: song.authors.map(aut => aut.artist)
            }
        })

        return result
    }

    static async getSongFileById(id: string) {
        const song = await db.query.songs.findFirst({ where: eq(songs.id, id) })
        if (!song) {
            return new NotFoundError('Song not found')
        }

        const filepath = path.join(filesDir, song.filename)

        if (!fs.existsSync(filepath)) {
            return new NotFoundError('Song not found')
        }

        return file(filepath)
    }

    static async getSongLyricsById(id: string) {
        const song = await db.query.songs.findFirst({ where: eq(songs.id, id) })
        if (!song) {
            return new NotFoundError('Song not found')
        }

        const extension = song.filename.slice(song.filename.lastIndexOf('.')+1)
        let lyricFilepath: string | undefined
        for(let ext of ['txt', 'lrc']){
            const filepath = path.join(filesDir, song.filename.replace(extension, ext))
            console.log(filepath)
            if(fs.existsSync(filepath)){
                lyricFilepath = filepath
                break
            }
        }

        if(!lyricFilepath){
            return new NotFoundError('No lyric file found for this song')
        }

        const lyrics = await Bun.file(lyricFilepath).text()
        return {
            synced: false,
            lyrics: lyrics.replaceAll('\r', '').split('\n'),
        }

    }

    static async getSongById(id: string){
        const song = await db.query.songs.findFirst({ 
            where: eq(songs.id, id), 
            with: {
                album: {
                    columns: {
                        artistId: false,
                        coverArtFormat: false,
                    }
                },
                authors: {
                    columns: {}, 
                    with: {
                        artist: true 
                    }
                }
            } 
        })
        
        if(!song){
            return new NotFoundError("Song not found")
        }

        return {
            id: song.id,
            title: song.title,
            color: song.color,
            contrastColor: song.contrastColor,
            createdAt: song.createdAt,
            updatedAt: song.updatedAt,
            album: song.album,
            authors: song.authors.map(aut => aut.artist)
        }
    }

    static async getCoverBySongId(id: string) {
        const song = await db.query.songs.findFirst({ where: eq(songs.id, id) })
        if (!song) {
            throw new NotFoundError('Song not found')
        }

        let filepath = path.join(imagesDir, `${song.id}.${song.coverArtFormat}`)
        if (!fs.existsSync(filepath) && !song.albumId) {
            throw new NotFoundError('Cover art file not found')
        }

        if(song.albumId && !fs.existsSync(filepath)){
            const album = await db.query.albums.findFirst({
                where: eq(albums.id, song.albumId)
            })

            if(!album){
                throw new NotFoundError('Cover art file not found')
            }
            filepath = path.join(imagesDir, 'album', `${album.id}.${album.coverArtFormat}`)
        }

        return file(filepath)
    }

    static async search(title: string){
        const songList = await db.query.songs.findMany({ 
            where: ilike(songs.title, `%${title}%`), 
            with: {
                album: {
                    columns: {
                        artistId: false,
                        coverArtFormat: false,
                    }
                },
                authors: {
                    columns: {}, 
                    with: {
                        artist: true 
                    }
                }
            } 
        })

        const result = songList.map((song) => {
            return {
                id: song.id,
                title: song.title,
                year: song.year,
                color: song.color,
                contrastColor: song.contrastColor,
                createdAt: song.createdAt,
                updatedAt: song.updatedAt,
                album: song.album,
                authors: song.authors.map(aut => aut.artist)
            }
        })

        return result
    }
}