CREATE TABLE `billing_plan_limits` (
	`plan_code` text PRIMARY KEY NOT NULL,
	`member_limit` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `billing_plan_limits` (`plan_code`, `member_limit`) VALUES
	('FREE', 10),
	('STANDARD', 30);
