import Elysia, { NotFoundError } from "elysia";
import { db } from "../../database";
import { eq } from "drizzle-orm";
import { artists } from "../../database/schema";
import ArtistService from "./service";
import { artistQuerySchema } from "./schema";

export const artistRouter = new Elysia({ prefix: '/artists', tags: ['Artists'] })
    .get('', async ({ query }) => {
        const artists = await ArtistService.getAll({
            field: query.sortField,
            order: query.sortOrder
        })

        return { artists }
    }, { query: artistQuerySchema, detail: {summary: 'Get artists'} })

    .get('/:id', async ({ params }) => {
        const artist = ArtistService.getById(params.id)
        return artist
    }, {detail: {summary: 'Get artist by id'}})

    .get('/:id/cover', async ({ params, set }) => {
        const songFile = await ArtistService.getCoverByArtistId(params.id)

        set.headers["content-type"] = songFile.type

        return songFile
    }, {detail: {summary: 'Get artist cover by id'}})