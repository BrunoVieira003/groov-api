import fs from 'node:fs';
import { filesDir, imagesDir, supportedFileFormats } from '../constants';
import { db } from '../database';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readFileQueue } from '../lib/queues/read-file';
import { pruneSongsQueue } from '../lib/queues/prune-songs';
import { pruneAssetsQueue } from '../lib/queues/prune-assets';
import { pruneAlbumsQueue } from '../lib/queues/prune-albums';
import { pruneArtistsQueue } from '../lib/queues/prune-artists';

function getAllFiles(dir: string, files: string[] = [], baseDir?: string): string[] {
    const absoluteDir = path.resolve(dir);
    const absoluteBaseDir = baseDir ? path.resolve(baseDir) : absoluteDir;

    const foundFiles = fs.readdirSync(absoluteDir);
    
    for (let found of foundFiles) {
        const foundpath = path.join(absoluteDir, found);
        const isDirectory = fs.statSync(foundpath).isDirectory();
        
        if (isDirectory) {
            getAllFiles(foundpath, files, absoluteBaseDir);
        } else {
            const relativePath = path.relative(absoluteBaseDir, foundpath);
            files.push(relativePath);
        }
    }

    return files;
}

export default class TaskService {
    static async createScanFolderTask() {
        const filenames = getAllFiles(filesDir)

        const songFiles = filenames.filter(fil => {
            for (let fileformat of supportedFileFormats){
                if(fil.endsWith(fileformat)){
                    return true
                }
            }

            return false
        })

        const jobs = await readFileQueue.addBulk(songFiles.map(filename => {
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

    static async createPruneAlbumsTask() {
        const job = await pruneAlbumsQueue.add('prune-albums', {})
        return { taskId: job.id }
    }

    static async createPruneArtistsTask() {
        const job = await pruneArtistsQueue.add('prune-artists', {})
        return { taskId: job.id }
    }

    static async createPruneAssetsTask() {
        const files = (await readdir(imagesDir, { recursive: true, withFileTypes: true })).filter(f => f.isFile())
        const filenames = files.map(f => path.relative(imagesDir, path.join(f.parentPath, f.name)))

        const job = await pruneAssetsQueue.add('prune-songs', { filenames })
        return { assetsAmount: filenames.length, taskId: job.id }
    }
}