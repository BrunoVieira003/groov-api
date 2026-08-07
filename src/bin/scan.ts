#!/usr/bin/env bun

import { readFileQueue } from "../lib/queues/read-file";
import path from 'path'
import fs from 'fs'
import { filesDir, supportedFileFormats } from "../lib/constants";

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

async function finish() {
    await readFileQueue.close()
    process.exit()
}

const allFiles = getAllFiles(filesDir)

const songFiles = allFiles.filter(fil => {
    for (let fileformat of supportedFileFormats) {
        if (fil.endsWith(fileformat)) {
            return true
        }
    }

    return false
})
const jobData = songFiles.map(f => ({ name: 'scan', data: { filename: f, deep: true } }))
await readFileQueue.addBulk(jobData)

readFileQueue.on('drained', finish)

