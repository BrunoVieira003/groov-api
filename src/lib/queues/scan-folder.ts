import BeeQueue from "bee-queue";
import { scanLocalFolder, ScanFileData } from "../processes/scan-folder";
import { env } from "bun";

const scanFileQueue = new BeeQueue<ScanFileData>('scanFile', { redis: env.REDIS_URL })

scanFileQueue.process(scanLocalFolder)

scanFileQueue.on('job succeeded', (jobId) => {
    console.log(jobId, ' success')
})

scanFileQueue.on('job failed', (jobId, err) => {
    console.log(jobId, ' failed by', err.message)
})

scanFileQueue.on('job retrying', (jobId, err) => {
    console.log(jobId, ' retrying by error ', err.message)
})

scanFileQueue.on('job progress', (jobId, progress) => {
    console.log(jobId, ' progress to ', progress)
})

export default scanFileQueue