import BeeQueue from "bee-queue"
import { pruneAssets, PruneAssetsData } from "../processes/prune-assets"
import { env } from "bun"

const pruneAssetsQueue = new BeeQueue<PruneAssetsData>('prune-assets', { redis: env.REDIS_URL})

pruneAssetsQueue.process(pruneAssets)
pruneAssetsQueue.on('job retrying', (jobId, err) => {
    console.log(jobId, ' retrying by error ', err.message)
})

export default pruneAssetsQueue