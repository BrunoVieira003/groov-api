import Elysia from "elysia";
import SongService from "../song/service";
import ArtistService from "../artists/service";
import { AlbumService } from "../albums/service";
import { PlaylistService } from "../playlists/service";

export const toolsRouter = new Elysia()
    .get('/search', async ({query}) => {
        const songResults = await SongService.search(query.q)
        const artistResults = await ArtistService.search(query.q)
        const albumResults = await AlbumService.search(query.q)
        const playlistResults = await PlaylistService.search(query.q)
        return {
            songs: songResults,
            artists: artistResults,
            albums: albumResults,
            playlists: playlistResults
        }
    })