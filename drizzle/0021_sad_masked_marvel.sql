CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`login_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_login_id_unique` ON `admin_users` (`login_id`);--> statement-breakpoint
CREATE INDEX `admin_users_status_idx` ON `admin_users` (`status`);--> statement-breakpoint
ALTER TABLE `contact_inquiries` DROP COLUMN `discord_delivery_status`;--> statement-breakpoint
ALTER TABLE `contact_inquiries` DROP COLUMN `discord_failure_reason`;--> statement-breakpoint
ALTER TABLE `contact_inquiries` DROP COLUMN `discord_delivered_at`;--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` integer NOT NULL,
	`session_token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`last_accessed_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_sessions_token_hash_unique` ON `admin_sessions` (`session_token_hash`);--> statement-breakpoint
CREATE INDEX `admin_sessions_admin_user_idx` ON `admin_sessions` (`admin_user_id`);--> statement-breakpoint
CREATE INDEX `admin_sessions_expires_at_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `admin_role_grants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_user_id` integer NOT NULL,
	`role` text NOT NULL,
	`granted_by_admin_user_id` integer,
	`grant_reason` text,
	`granted_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`revoked_at` integer,
	`revoked_by_admin_user_id` integer,
	`revoke_reason` text,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by_admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`revoked_by_admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `admin_role_grants_admin_user_idx` ON `admin_role_grants` (`admin_user_id`);--> statement-breakpoint
CREATE INDEX `admin_role_grants_role_idx` ON `admin_role_grants` (`role`);--> statement-breakpoint
CREATE INDEX `admin_role_grants_active_lookup_idx` ON `admin_role_grants` (`admin_user_id`,`role`,`revoked_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_type` text NOT NULL,
	`actor_user_id` integer,
	`actor_admin_user_id` integer,
	`workspace_id` integer,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`action_type` text NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_workspace_created_idx` ON `audit_logs` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_created_idx` ON `audit_logs` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_user_created_idx` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_admin_created_idx` ON `audit_logs` (`actor_admin_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_type_created_idx` ON `audit_logs` (`actor_type`,`created_at`);
