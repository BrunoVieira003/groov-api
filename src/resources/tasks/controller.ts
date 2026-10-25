import Elysia from "elysia";
import TaskService from "./service";
import { scanFolderBody } from "./schema";

export const taskRouter = new Elysia({ prefix: '/tasks', tags: ['Tasks'] })
    .post('scan-folder', async ({ body }) => {
        const result = await TaskService.createScanFolderTask(body.skipScanned)
        return result
    }, { body: scanFolderBody, detail: {summary: 'Scans folder'} })
    .post('prune-songs', async () => {
        const result = await TaskService.createPruneSongsTask()
        return result
    }, { detail: {summary: 'Prune songs'} })
    .post('prune-assets', async () => {
        const result = await TaskService.createPruneAssetsTask()
        return result
    }, { detail: {summary: 'Prune assets'} })
    .post('prune-albums', async () => {
        const result = await TaskService.createPruneAlbumsTask()
        return result
    }, { detail: {summary: 'Prune albums'} })
    .post('prune-artists', async () => {
        const result = await TaskService.createPruneArtistsTask()
        return result
    }, { detail: {summary: 'Prune artists'} })
