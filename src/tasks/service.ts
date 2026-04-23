import fs from 'node:fs';
import { filesDir, imagesDir } from '../constants';
import { db } from '../database';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readFileQueue } from '../lib/queues/read-file';
import { pruneSongsQueue } from '../lib/queues/prune-songs';
import { pruneAssetsQueue } from '../lib/queues/prune-assets';

export default class TaskService {
    static async createScanFolderTask() {
        const filenames = fs.readdirSync(filesDir)
        const jobs = await readFileQueue.addBulk(filenames.map(filename => {
            return {
                name: filename,
                data: {filename},
            }
        }))

        return { detectedFiles: filenames.length, tasks: jobs.map(j => j.id) }
    }

    static async createPruneSongsTask() {
        const filenames = (await db.query.songs.findMany()).map(s => s.filename)
        const job = await pruneSongsQueue.add('prune-songs', { filenames })
        return { songsAmount: filenames.length, taskId: job.id }
    }

    static async createPruneAssetsTask() {
        const files = (await readdir(imagesDir, { recursive: true, withFileTypes: true })).filter(f => f.isFile())
        const filenames = files.map(f => path.relative(imagesDir, path.join(f.parentPath, f.name)))

        const job = await pruneAssetsQueue.add('prune-songs', { filenames })
        return { songsAmount: filenames.length, taskId: job.id }
    }
}