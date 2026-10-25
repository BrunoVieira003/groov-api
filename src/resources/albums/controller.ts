import Elysia from "elysia";
import { AlbumService } from "./service";
import { albumQuerySchema } from "./schema";

export const albumRouter = new Elysia({ prefix: 'albums', tags: ['Albums']})
    .get('', async ({ query }) => {
        const albums = await AlbumService.getAll({
            field: query.sortField,
            order: query.sortOrder
        })
        return { albums }
    }, { query: albumQuerySchema, detail: {summary: 'Get albums'} })

    .get(':id', async ({ params }) => {
        const album = await AlbumService.getById(params.id)
        return album
    }, {detail: {summary: 'Get album by id'}})

    .get('/:id/cover', async ({ params, set }) => {
        const songFile = await AlbumService.getCoverByAlbumId(params.id)

        set.headers["content-type"] = songFile.type

        return songFile
    }, {detail: {summary: 'Get album cover by id'}})

    .get('/:id/featured', async ({params}) => {
        const artists = await AlbumService.getFeaturedArtists(params.id)
        return {artists}
    }, {detail: {summary: 'Get featured artists'}})