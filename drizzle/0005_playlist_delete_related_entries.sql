ALTER TABLE "songs_to_playlists" DROP CONSTRAINT "songs_to_playlists_songId_songs_id_fk";
--> statement-breakpoint
ALTER TABLE "songs_to_playlists" DROP CONSTRAINT "songs_to_playlists_playlistId_playlists_id_fk";
--> statement-breakpoint
ALTER TABLE "songs_to_playlists" ADD CONSTRAINT "songs_to_playlists_songId_songs_id_fk" FOREIGN KEY ("songId") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs_to_playlists" ADD CONSTRAINT "songs_to_playlists_playlistId_playlists_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;