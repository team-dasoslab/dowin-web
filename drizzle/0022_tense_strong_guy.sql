CREATE TABLE `auth_login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`custom_id` text NOT NULL,
	`ip_address` text DEFAULT '' NOT NULL,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`first_failed_at` integer NOT NULL,
	`last_failed_at` integer NOT NULL,
	`blocked_until` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_login_attempts_custom_id_ip_unique` ON `auth_login_attempts` (`custom_id`,`ip_address`);--> statement-breakpoint
CREATE INDEX `auth_login_attempts_blocked_until_idx` ON `auth_login_attempts` (`blocked_until`);