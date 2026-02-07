import { ilike } from "drizzle-orm"
import { db } from "../database"
import { artists } from "../database/schema"

export default class ArtistService{
    static async search(name: string){
        const artistList = await db.query.artists.findMany({ 
            where: ilike(artists.name, `%${name}%`),
        })
    
        const result = artistList.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
            }
        })
    
        return result
        }
}