import Elysia from "elysia";
import SongService from "../song/service";
import ArtistService from "../artists/service";

export const toolsRouter = new Elysia()
    .get('/search', async ({query}) => {
        const songResults = await SongService.search(query.q)
        const artistResults = await ArtistService.search(query.q)
        return {
            songs: songResults,
            artistResults: artistResults
        }
    })