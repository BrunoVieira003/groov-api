import BeeQueue from "bee-queue";
import { scanLocalFolder, ScanFolderData } from "../processes/scan-folder";
import { env } from "bun";

const scanFileQueue = new BeeQueue<ScanFolderData>('scanFolder', { redis: env.REDIS_URL })

scanFileQueue.process(scanLocalFolder)

scanFileQueue.on('job retrying', (jobId, err) => {
    console.log(jobId, ' retrying by error ', err.message)
})

export default scanFileQueue