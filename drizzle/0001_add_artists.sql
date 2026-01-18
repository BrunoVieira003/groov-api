CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs_to_artists" (
	"songId" uuid NOT NULL,
	"artistId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "songs_to_artists" ADD CONSTRAINT "songs_to_artists_songId_songs_id_fk" FOREIGN KEY ("songId") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs_to_artists" ADD CONSTRAINT "songs_to_artists_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;