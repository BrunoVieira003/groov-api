import BeeQueue from "bee-queue";
import { env } from "bun";
import { ReadFileData, readFileData } from "../processes/read-file";

const readFileQueue = new BeeQueue<ReadFileData>('readFileData', { redis: env.REDIS_URL})

readFileQueue.process(readFileData)

readFileQueue.on('job retrying', (jobId, err) => {
    console.log(jobId, ' retrying by error ', err.message)
})

export default readFileQueue