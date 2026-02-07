import { file, NotFoundError } from "elysia";
import { db } from "../database";
import path from 'node:path';
import fs from 'node:fs';
import { eq, ilike } from "drizzle-orm";
import { songs } from "../database/schema";
import { filesDir, imagesDir } from "../constants";

export default class SongService {
    static async getAll() {
        const songList = await db.query.songs.findMany({
            with: {
                authors: {
                    columns: {},
                    with: { artist: true }
                }
            }
        })

        const result = songList.map((song) => {
            return {
                id: song.id,
                title: song.title,
                year: song.year,
                color: song.color,
                createdAt: song.createdAt,
                updatedAt: song.updatedAt,
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

    static async getSongById(id: string){
        const song = await db.query.songs.findFirst({ 
            where: eq(songs.id, id), 
            with: {
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
            createdAt: song.createdAt,
            updatedAt: song.updatedAt,
            authors: song.authors.map(aut => aut.artist)
        }
    }

    static async getCoverBySongId(id: string) {
        const song = await db.query.songs.findFirst({ where: eq(songs.id, id) })
        if (!song) {
            throw new NotFoundError('Song not found')
        }

        const filepath = path.join(imagesDir, `${song.id}.${song.coverArtFormat}`)
        if (!fs.existsSync(filepath)) {
            throw new NotFoundError('Cover art file not found')
        }

        return file(filepath)
    }

    static async search(title: string){
        const songList = await db.query.songs.findMany({ 
            where: ilike(songs.title, `%${title}%`), 
            with: {
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
                createdAt: song.createdAt,
                updatedAt: song.updatedAt,
                authors: song.authors.map(aut => aut.artist)
            }
        })

        return result
    }
}