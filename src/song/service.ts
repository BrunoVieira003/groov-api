import { file, NotFoundError } from "elysia";
import { db } from "../database";
import path from 'node:path';
import fs from 'node:fs';
import { eq } from "drizzle-orm";
import { songs } from "../database/schema";
import { filesDir } from "../constants";

export default class SongService {
    static async getAll() {
        const songs = await db.query.songs.findMany({
            with: {
                authors: {
                    columns: {},
                    with: { artist: true }
                }
            }
        })

        const result = songs.map((song) => {
            return {
                id: song.id,
                title: song.title,
                year: song.year,
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
            createdAt: song.createdAt,
            updatedAt: song.updatedAt,
            authors: song.authors.map(aut => aut.artist)
        }
    }
}