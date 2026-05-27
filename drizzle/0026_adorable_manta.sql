ALTER TABLE `workspaces` ADD `uid` text;--> statement-breakpoint
UPDATE `workspaces` SET `uid` = lower(hex(randomblob(6))) WHERE `uid` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_uid_unique` ON `workspaces` (`uid`);