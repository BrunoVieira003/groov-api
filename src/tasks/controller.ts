import Elysia, { status } from "elysia";
import TaskService from "./service";
import scanFolderQueue from "../lib/queues/scan-folder";
import readFileQueue from "../lib/queues/read-file";
import pruneSongsQueue from "../lib/queues/prune-songs";
import { getProgressParams } from "./schema";

const queues = {
    'scan-folder': scanFolderQueue,
    'upload': readFileQueue,
    'prune-songs': pruneSongsQueue
}

export const taskRouter = new Elysia({prefix: '/tasks'})
    .post('scan-folder', async () => {
        const result = await TaskService.createScanFolderTask()

        return result
    })
    .post('prune-songs', async () => {
        const result = await TaskService.createPruneSongsTask()
        return result
    })
    .get(':taskType/:taskId', async ({params, set}) => {
        set.headers["content-type"] = 'text/event-stream'
        
        return new ReadableStream({
            async start(controller){
                
                const send = (data: any) => {
                    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
                }
                const queue = queues[params.taskType]
                const job = await queue.getJob(params.taskId)

                if(job){
                    if(job.status === 'succeeded'){
                        send({status: 'done', progress: 100})
                        controller.close()
                    }else{
                        job.on('progress', p => send(p) )
                        job.on('succeeded', p => send({status: 'done', progress: 100}))
                        job.on('failed', p => send({status: 'failed', progress: 0}))
                    }
                }else{
                    controller.close()
                }
            }
        })
    }, {params: getProgressParams})
