CREATE TABLE `leader_reminder_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`sender_user_id` integer NOT NULL,
	`target_user_id` integer NOT NULL,
	`lead_measure_id` integer NOT NULL,
	`template_key` text NOT NULL,
	`custom_message` text,
	`delivered_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_notification_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`daily_reminder_enabled` integer DEFAULT false NOT NULL,
	`daily_reminder_hour` integer DEFAULT 21 NOT NULL,
	`daily_reminder_minute` integer DEFAULT 0 NOT NULL,
	`timezone` text DEFAULT 'Asia/Seoul' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_notification_settings_user_unique` ON `user_notification_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `workspace_notification_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`leader_weekly_report_enabled` integer DEFAULT false NOT NULL,
	`leader_weekly_report_day_of_week` integer DEFAULT 1 NOT NULL,
	`leader_weekly_report_hour` integer DEFAULT 9 NOT NULL,
	`leader_weekly_report_minute` integer DEFAULT 0 NOT NULL,
	`timezone` text DEFAULT 'Asia/Seoul' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_notification_settings_workspace_unique` ON `workspace_notification_settings` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `plan_code` text DEFAULT 'FREE' NOT NULL;