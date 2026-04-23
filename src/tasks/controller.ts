import Elysia from "elysia";
import TaskService from "./service";

export const taskRouter = new Elysia({ prefix: '/tasks' })
    .post('scan-folder', async () => {
        const result = await TaskService.createScanFolderTask()

        return result
    })
    .post('prune-songs', async () => {
        const result = await TaskService.createPruneSongsTask()
        return result
    })
    .post('prune-assets', async () => {
        const result = await TaskService.createPruneAssetsTask()
        return result
    })
