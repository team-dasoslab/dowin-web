CREATE TABLE `lead_measure_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_measure_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `workspace_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lead_measure_tags_measure_tag_unique` ON `lead_measure_tags` (`lead_measure_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `workspace_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`created_by_user_id` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_tags_workspace_normalized_name_unique` ON `workspace_tags` (`workspace_id`,`normalized_name`);