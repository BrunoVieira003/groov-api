import Elysia, { NotFoundError } from "elysia";
import { db } from "../database";
import { eq } from "drizzle-orm";
import { artists } from "../database/schema";
import ArtistService from "./service";
import { artistQuerySchema } from "./schema";

export const artistRouter = new Elysia({prefix: '/artist'})
    .get('', async ({ query }) => {
        const artists = await ArtistService.getAll({
            field: query.sortField,
            order: query.sortOrder
        })

        return { artists }
    }, {query: artistQuerySchema})

    .get('/:id', async ({params}) => {
        const artist = ArtistService.getById(params.id)
        return artist
    })