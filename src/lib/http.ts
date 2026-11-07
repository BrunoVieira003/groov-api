import { BunFile } from "bun";
import { NotFoundError, t } from "elysia";

/** Returning a sliced Bun file lets Bun use sendfile and set Content-Length instead of chunking a stream */
export function streamFile(file: BunFile, range?: string) {
    const size = file.size
    const headers = { 'Content-Type': file.type, 'Accept-Ranges': 'bytes' }

    if (!range) {
        return new Response(file, { headers })
    }

    const [, startStr, endStr] = /bytes=(\d*)-(\d*)/.exec(range) ?? []
    const isSuffix = !startStr && endStr
    const start = isSuffix ? Math.max(size - Number(endStr), 0) : Number(startStr)
    const end = isSuffix || !endStr ? size - 1 : Math.min(Number(endStr), size - 1)

    if (start >= size || start > end) {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
    }

    return new Response(file.slice(start, end + 1), {
        status: 206,
        headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}` }
    })
}

export const coverHeadersSchema = t.Object({
    'if-none-match': t.Optional(t.String())
})

/** Covers can change on rescans, so clients revalidate through the ETag instead of keeping a stale copy */
export async function coverResponse(filepath: string, ifNoneMatch?: string) {
    const file = Bun.file(filepath)
    if (!await file.exists()) {
        throw new NotFoundError('Cover art file not found')
    }

    const etag = `"${file.size.toString(16)}-${file.lastModified.toString(16)}"`
    const headers = { 'ETag': etag, 'Cache-Control': 'no-cache' }

    if (ifNoneMatch === etag) {
        return new Response(null, { status: 304, headers })
    }

    return new Response(file, { headers })
}
