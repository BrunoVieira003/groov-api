import Elysia from "elysia";
import TaskService from "./service";
import { db } from "../database";
import { artists, songsToArtists } from "../database/schema";


export const taskRouter = new Elysia({prefix: '/tasks'})
    .post('scan-folder', async () => {
        const result = await TaskService.createScanFolderTask()

        return result
    })
    .post('empty-db', async () => {
        await db.delete(songsToArtists)
        await db.delete(artists)
        await db.delete(artists)
    })
