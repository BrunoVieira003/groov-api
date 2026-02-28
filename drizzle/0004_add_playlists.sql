CREATE TABLE "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs_to_playlists" (
	"songId" uuid NOT NULL,
	"playlistId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "songs_to_playlists" ADD CONSTRAINT "songs_to_playlists_songId_songs_id_fk" FOREIGN KEY ("songId") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs_to_playlists" ADD CONSTRAINT "songs_to_playlists_playlistId_playlists_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;