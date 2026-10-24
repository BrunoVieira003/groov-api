CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`year` integer,
	`colors` text,
	`artistId` text,
	FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artist_name_unique` ON `artists` (`name`);--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`year` integer,
	`filename` text NOT NULL,
	`duration` integer,
	`colors` text,
	`album_id` text,
	`fingerprint` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `song_filename_unique` ON `songs` (`filename`);--> statement-breakpoint
CREATE TABLE `songs_to_artists` (
	`songId` text NOT NULL,
	`artistId` text NOT NULL,
	PRIMARY KEY(`songId`, `artistId`),
	FOREIGN KEY (`songId`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `songs_to_playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`songId` text NOT NULL,
	`playlistId` text NOT NULL,
	`trackNumber` integer,
	FOREIGN KEY (`songId`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`playlistId`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade
);
