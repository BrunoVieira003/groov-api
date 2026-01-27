import Elysia, { sse } from "elysia";
import TaskService from "./service";
import scanFileQueue from "../lib/queues/scan-folder";

function createTaskStream(id: string): ReadableStream<string>{
    return new ReadableStream({
        async start(controller){
            const job = await scanFileQueue.getJob(id)
            if(["succeeded", "failed"].includes(job.status)){
                controller.close()
            }

            job.on('progress', (progress) => {
                console.log(progress)
                controller.enqueue(String(progress))
            })

            job.on('succeeded', () => {
                controller.enqueue(String({status: 'success', progress: 100}))
                controller.close()
            })

            job.on('failed', () => {
                controller.enqueue(String({status: 'failed', progress: 100}))
                controller.close()
            })
        },
        cancel(){
            console.log('client disconnected')
        }
    })
}

export const taskRouter = new Elysia({prefix: '/tasks'})
    .post('scan-folder', async () => {
        const result = await TaskService.createScanFolderTask()

        return result
    })
    .get('/listen/:taskId', ({params}) => {
        return sse(createTaskStream(params.taskId))
    })
