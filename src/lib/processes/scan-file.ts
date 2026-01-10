import { parseFile } from "music-metadata"
import path from "node:path"
import { Job } from "bee-queue"
import { db } from "../../database"
import { songs } from "../../database/schema"
import { filesDir } from "../../constants"

export interface ScanFileData {
    filename: string
}

export async function scanLocalFile(job: Job<ScanFileData>) {
    const { data } = job
    const { filename } = data

    const filepath = path.join(filesDir, filename)

    const metadata = await parseFile(filepath)

    const title = metadata.common.title || filename

    await db.insert(songs).values({
        title,
        filename,
        year: metadata.common.year
    })
}