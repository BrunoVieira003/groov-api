import fs from 'node:fs';
import scanFolderQueue from "../lib/queues/scan-folder";
import { filesDir, imagesDir } from '../constants';
import { db } from '../database';
import pruneSongsQueue from '../lib/queues/prune-songs';
import { readdir } from 'node:fs/promises';
import pruneAssetsQueue from '../lib/queues/prune-assets';
import path from 'node:path';

export default class TaskService{
    static async createScanFolderTask(){
        const filenames = fs.readdirSync(filesDir)
        const job = await scanFolderQueue.createJob({filenames}).save()

        return { detectedFiles: filenames.length, taskId: job.id }
    }

    static async createPruneSongsTask(){
        const filenames = (await db.query.songs.findMany()).map(s => s.filename)
        const job = await pruneSongsQueue.createJob({filenames}).save()
        return {songsAmount: filenames.length, taskId: job.id}
    }

    static async createPruneAssetsTask(){
        const files = (await readdir(imagesDir, {recursive: true, withFileTypes: true})).filter(f => f.isFile())
        const filenames = files.map(f => path.relative(imagesDir, path.join(f.parentPath, f.name)))

        const job = await pruneAssetsQueue.createJob({filenames}).save()
        return {assetsAmount: filenames.length, taskId: job.id}
    }
}