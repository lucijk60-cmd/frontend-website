CREATE TABLE `visitor_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorKeyHash` varchar(64) NOT NULL,
	`path` varchar(255) NOT NULL,
	`countryCode` varchar(8) NOT NULL DEFAULT 'unknown',
	`deviceClass` enum('desktop','mobile','tablet','unknown') NOT NULL DEFAULT 'unknown',
	`referrer` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitor_events_id` PRIMARY KEY(`id`)
);
