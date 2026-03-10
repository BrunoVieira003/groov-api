ALTER TABLE "songs_to_artists" DROP CONSTRAINT "songs_to_artists_songId_songs_id_fk";
--> statement-breakpoint
ALTER TABLE "songs_to_artists" DROP CONSTRAINT "songs_to_artists_artistId_artists_id_fk";
--> statement-breakpoint
ALTER TABLE "songs_to_artists" ADD CONSTRAINT "songs_to_artists_songId_songs_id_fk" FOREIGN KEY ("songId") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs_to_artists" ADD CONSTRAINT "songs_to_artists_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;