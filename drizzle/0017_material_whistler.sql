CREATE TABLE `device_push_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`provider` text DEFAULT 'FCM' NOT NULL,
	`platform` text NOT NULL,
	`token` text NOT NULL,
	`app_version` text,
	`notification_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`last_seen_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`disabled_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_push_tokens_token_unique` ON `device_push_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `device_push_tokens_user_idx` ON `device_push_tokens` (`user_id`);