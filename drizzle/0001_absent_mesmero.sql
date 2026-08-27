CREATE TABLE `admin_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('image','video') NOT NULL,
	`language` enum('en','ar','shared') NOT NULL DEFAULT 'shared',
	`title` varchar(180) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` varchar(768) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_media_id` PRIMARY KEY(`id`)
);
