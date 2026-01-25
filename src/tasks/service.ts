import fs from 'node:fs';
import scanFolderQueue from "../lib/queues/scan-folder";
import { filesDir } from '../constants';

export default class TaskService{
    static async createScanFolderTask(){
        const filenames = fs.readdirSync(filesDir)
        for (let f of filenames) {
            await scanFolderQueue.createJob({ filename: f }).save()
        }

        return { detectedFiles: filenames.length }
    }
}