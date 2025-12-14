CREATE TABLE `audioStems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneId` int,
	`stemType` enum('dialogue','narration','music','foley') NOT NULL,
	`audioUrl` text,
	`audioKey` text,
	`durationSeconds` int,
	`characterName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audioStems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generationJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`jobType` enum('NARRATIVE_PARSING','SCENE_PLANNING','IMAGE_GENERATION','VIDEO_GENERATION','AUDIO_GENERATION','ASSEMBLY') NOT NULL,
	`providerJobId` varchar(255),
	`provider` varchar(100),
	`metadata` json,
	`status` enum('QUEUED','PROCESSING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'QUEUED',
	`errorMessage` text,
	`costCents` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generationJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceTitle` varchar(255) NOT NULL,
	`sourceType` enum('book','script') NOT NULL,
	`sourceFileUrl` text,
	`sourceFileKey` text,
	`format` enum('film_16x9','series_16x9','vertical_9x16') NOT NULL,
	`stylePreset` varchar(100) NOT NULL,
	`castingOverrideMain` text,
	`targetRuntimeMinutes` int NOT NULL DEFAULT 10,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`status` enum('NEW','INGESTION_STARTED','PARSING_COMPLETE','PLANNING_COMPLETE','IMAGE_GEN_IN_PROGRESS','IMAGES_COMPLETE','VIDEO_GEN_IN_PROGRESS','VIDEOS_COMPLETE','AUDIO_GEN_IN_PROGRESS','AUDIO_COMPLETE','ASSEMBLY_IN_PROGRESS','DELIVERED','NEEDS_REVIEW','FAILED') NOT NULL DEFAULT 'NEW',
	`retryCount` int NOT NULL DEFAULT 0,
	`finalRenderUrl` text,
	`finalRenderKey` text,
	`totalCost` int NOT NULL DEFAULT 0,
	`generationTimeSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneId` varchar(50) NOT NULL,
	`sceneSummary` text,
	`location` varchar(255),
	`emotion` varchar(100),
	`characters` json,
	`status` enum('PENDING','SHOTS_PLANNED','IMAGES_GENERATING','IMAGES_COMPLETE','VIDEOS_GENERATING','VIDEOS_COMPLETE','COMPLETE','FAILED') NOT NULL DEFAULT 'PENDING',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sceneId` int NOT NULL,
	`shotId` varchar(50) NOT NULL,
	`shotType` enum('wide','medium','close') NOT NULL,
	`cameraStyle` varchar(100),
	`characters` json,
	`wardrobeLock` int NOT NULL DEFAULT 1,
	`lighting` varchar(255),
	`imagePrompt` text NOT NULL,
	`videoMotionPrompt` text,
	`seed` int,
	`durationSeconds` int NOT NULL DEFAULT 3,
	`imageUrl` text,
	`imageKey` text,
	`videoUrl` text,
	`videoKey` text,
	`qualityScore` int,
	`similarityScore` int,
	`status` enum('PENDING','IMAGE_GENERATING','IMAGE_COMPLETE','IMAGE_FAILED','VIDEO_GENERATING','VIDEO_COMPLETE','VIDEO_FAILED','COMPLETE') NOT NULL DEFAULT 'PENDING',
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storyGraphs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`characters` json,
	`locations` json,
	`plotBeats` json,
	`dialogue` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storyGraphs_id` PRIMARY KEY(`id`)
);
