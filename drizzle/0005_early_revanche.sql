CREATE TABLE `call_businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `call_businesses_businessId_unique` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `call_operators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`operatorId` varchar(96) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`status` enum('offline','online','busy') NOT NULL DEFAULT 'offline',
	`lastSeenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_operators_id` PRIMARY KEY(`id`),
	CONSTRAINT `call_operators_operatorId_unique` UNIQUE(`operatorId`)
);
--> statement-breakpoint
CREATE TABLE `call_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callId` varchar(96) NOT NULL,
	`businessId` varchar(64) NOT NULL,
	`operatorId` varchar(96),
	`callerSessionId` varchar(128),
	`customerTokenHash` varchar(128) NOT NULL,
	`status` enum('idle','calling','ringing','connecting','connected','reconnecting','ended','rejected','busy','failed','permission_denied') NOT NULL DEFAULT 'calling',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`endedAt` timestamp,
	`durationSeconds` int,
	`lastSignalAt` timestamp,
	CONSTRAINT `call_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `call_sessions_callId_unique` UNIQUE(`callId`)
);
