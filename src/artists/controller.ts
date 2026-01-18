import Elysia, { NotFoundError } from "elysia";
import { db } from "../database";
import { eq } from "drizzle-orm";
import { artists } from "../database/schema";

export const artistRouter = new Elysia({prefix: '/artist'})
    .get('', async () => {
        const artists = await db.query.artists.findMany()
        return { artists }
    })
    .get('/:id', async ({params}) => {
        const artist = await db.query.artists.findFirst({
            where: eq(artists.id, params.id),
            with: {
                songs: {
                    columns: {},
                    with: {
                        song: {
                            columns: { filename: false },
                            with: {
                                authors:  {
                                    columns: {},
                                    with: {
                                        artist: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        if(!artist){
            return new NotFoundError('Song not found')
        }

        return { artist }
    })