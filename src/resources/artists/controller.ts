import Elysia, { NotFoundError } from "elysia";
import { db } from "../../database";
import { eq } from "drizzle-orm";
import { artists } from "../../database/schema";
import ArtistService from "./service";
import { artistQuerySchema } from "./schema";
import { coverHeadersSchema, coverResponse } from "../../lib/http";

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

    .get('/:id/cover', async ({ params, headers }) => {
        const filepath = await ArtistService.getCoverPathByArtistId(params.id)
        return coverResponse(filepath, headers['if-none-match'])
    }, {headers: coverHeadersSchema, detail: {summary: 'Get artist cover by id'}})