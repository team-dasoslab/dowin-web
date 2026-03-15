CREATE TABLE `daily_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_measure_id` integer NOT NULL,
	`log_date` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lead_measures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scoreboard_id` integer NOT NULL,
	`name` text NOT NULL,
	`target_value` integer DEFAULT 1 NOT NULL,
	`period` text DEFAULT 'DAILY' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`scoreboard_id`) REFERENCES `scoreboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scoreboards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`workspace_id` integer NOT NULL,
	`goal_name` text NOT NULL,
	`lag_measure` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_active_scoreboard` ON `scoreboards` (`user_id`,`workspace_id`) WHERE "scoreboards"."status" = 'ACTIVE';