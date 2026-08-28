ALTER TABLE `reviews` ADD `publicReference` varchar(32);--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_publicReference_unique` UNIQUE(`publicReference`);