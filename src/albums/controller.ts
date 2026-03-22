import Elysia from "elysia";
import { AlbumService } from "./service";

export const albumRouter = new Elysia({prefix: 'albums'})
    .get('', async () => {
        const albums = await AlbumService.getAll()
        return { albums }
    })
    .get(':id', async ({params}) => {
        const album = await AlbumService.getById(params.id)
        return album
    })