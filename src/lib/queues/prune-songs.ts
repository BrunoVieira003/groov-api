import BeeQueue from "bee-queue";
import { env } from "bun";
import { pruneSongs, PruneSongsData } from "../processes/prune-songs";

const pruneSongsQueue = new BeeQueue<PruneSongsData>('prune-songs', { redis: env.REDIS_URL})

pruneSongsQueue.process(pruneSongs)
pruneSongsQueue.on('job retrying', (jobId, err) => {
    console.log(jobId, ' retrying by error ', err.message)
})

export default pruneSongsQueue