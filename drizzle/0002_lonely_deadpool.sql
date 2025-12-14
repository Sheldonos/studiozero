CREATE TABLE `custom_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`asset_type` enum('character_reference','location_reference','style_reference','prop') NOT NULL,
	`asset_name` varchar(255) NOT NULL,
	`asset_url` text NOT NULL,
	`asset_key` text NOT NULL,
	`thumbnail_url` text,
	`description` text,
	`tags` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_assets_id` PRIMARY KEY(`id`)
);
