ALTER TABLE "songs_to_playlists" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "songs_to_playlists" ADD COLUMN "trackNumber" integer;