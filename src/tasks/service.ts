import fs from 'node:fs';
import scanFolderQueue from "../lib/queues/scan-folder";
import { filesDir } from '../constants';
import { db } from '../database';
import pruneSongsQueue from '../lib/queues/prune-songs';

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
}