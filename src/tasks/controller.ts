import Elysia from "elysia";
import TaskService from "./service";
import scanFolderQueue from "../lib/queues/scan-folder";
import readFileQueue from "../lib/queues/read-file";

const queues = [
    scanFolderQueue,
    readFileQueue
]

async function getJobFromAnyQueue(jobId: string){
    for(let q of queues){
        const job = await q.getJob(jobId)
        if(job){
            return job
        }
    }

    return undefined
}

export const taskRouter = new Elysia({prefix: '/tasks'})
    .post('scan-folder', async () => {
        const result = await TaskService.createScanFolderTask()

        return result
    })
    .get(':taskId/progress', async ({params, set}) => {
        set.headers["content-type"] = 'text/event-stream'
        
        return new ReadableStream({
            async start(controller){
                
                const send = (data: any) => {
                    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
                }

                const job = await getJobFromAnyQueue(params.taskId)

                if(job){
                    job.on('progress', p => send(p))
                    job.on('succeeded', p => send({status: 'done', progress: 100}))
                    job.on('failed', p => send({status: 'failed', progress: 0}))
                }
            }
        })
    })
