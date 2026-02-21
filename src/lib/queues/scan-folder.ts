import BeeQueue from "bee-queue";
import { scanLocalFolder, ScanFolderData } from "../processes/scan-folder";
import { env } from "bun";

const scanFolderQueue = new BeeQueue<ScanFolderData>('scanFolder', { redis: env.REDIS_URL })

scanFolderQueue.process(scanLocalFolder)

scanFolderQueue.on('job retrying', (jobId, err) => {
    console.log(jobId, ' retrying by error ', err.message)
})

export default scanFolderQueue