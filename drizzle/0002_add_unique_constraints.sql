ALTER TABLE "songs_to_artists" ADD CONSTRAINT "songs_to_artists_songId_artistId_pk" PRIMARY KEY("songId","artistId");--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artist_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "song_filename_unique" UNIQUE("filename");