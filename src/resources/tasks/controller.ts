import Elysia from "elysia";
import TaskService from "./service";
import { scanFolderBody } from "./schema";

export const taskRouter = new Elysia({ prefix: '/tasks' })
    .post('scan-folder', async ({ body }) => {
        const result = await TaskService.createScanFolderTask(body.skipScanned)
        return result
    }, { body: scanFolderBody })
    .post('prune-songs', async () => {
        const result = await TaskService.createPruneSongsTask()
        return result
    })
    .post('prune-assets', async () => {
        const result = await TaskService.createPruneAssetsTask()
        return result
    })
    .post('prune-albums', async () => {
        const result = await TaskService.createPruneAlbumsTask()
        return result
    })
    .post('prune-artists', async () => {
        const result = await TaskService.createPruneArtistsTask()
        return result
    })
