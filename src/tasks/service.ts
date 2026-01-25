import fs from 'node:fs';
import scanFolderQueue from "../lib/queues/scan-folder";
import { filesDir } from '../constants';

export default class TaskService{
    static async createScanFolderTask(){
        const filenames = fs.readdirSync(filesDir)
        const job = await scanFolderQueue.createJob({filenames}).save()

        return { detectedFiles: filenames.length, taskId: job.id }
    }
}