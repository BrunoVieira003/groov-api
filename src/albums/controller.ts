import Elysia from "elysia";
import { AlbumService } from "./service";
import { albumQuerySchema } from "./schema";

export const albumRouter = new Elysia({ prefix: 'albums' })
    .get('', async ({ query }) => {
        const albums = await AlbumService.getAll({
            field: query.sortField,
            order: query.sortOrder
        })
        return { albums }
    }, { query: albumQuerySchema })

    .get(':id', async ({ params }) => {
        const album = await AlbumService.getById(params.id)
        return album
    })

    .get('/:id/cover', async ({ params, set }) => {
        const songFile = await AlbumService.getCoverByAlbumId(params.id)

        set.headers["content-type"] = songFile.type

        return songFile
    })