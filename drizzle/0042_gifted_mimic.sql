CREATE TABLE `action_item_public_ids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`lead_measure_id` integer NOT NULL,
	`display_sequence` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `action_item_public_ids_lead_measure_unique` ON `action_item_public_ids` (`lead_measure_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `action_item_public_ids_workspace_sequence_unique` ON `action_item_public_ids` (`workspace_id`,`display_sequence`);--> statement-breakpoint
CREATE TABLE `github_installation_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state` text NOT NULL,
	`user_id` integer NOT NULL,
	`workspace_id` integer NOT NULL,
	`locale` text NOT NULL,
	`installation_id` text,
	`setup_action` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_installation_states_state_unique` ON `github_installation_states` (`state`);--> statement-breakpoint
CREATE INDEX `github_installation_states_user_idx` ON `github_installation_states` (`user_id`);--> statement-breakpoint
CREATE INDEX `github_installation_states_workspace_idx` ON `github_installation_states` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `github_pr_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`lead_measure_id` integer NOT NULL,
	`repository_link_id` integer NOT NULL,
	`github_pull_request_id` text NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`state` text NOT NULL,
	`matched_display_key` text NOT NULL,
	`daily_log_date` text,
	`daily_log_applied_at` integer,
	`last_synced_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_link_id`) REFERENCES `workspace_github_repository_links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_pr_links_repo_number_measure_unique` ON `github_pr_links` (`repository_link_id`,`number`,`lead_measure_id`);--> statement-breakpoint
CREATE INDEX `github_pr_links_lead_measure_state_idx` ON `github_pr_links` (`lead_measure_id`,`state`);--> statement-breakpoint
CREATE TABLE `github_repositories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`installation_id` integer NOT NULL,
	`github_repository_id` text NOT NULL,
	`owner_login` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`private` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`installation_id`) REFERENCES `github_user_installations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_repositories_installation_repo_unique` ON `github_repositories` (`installation_id`,`github_repository_id`);--> statement-breakpoint
CREATE INDEX `github_repositories_github_repository_idx` ON `github_repositories` (`github_repository_id`);--> statement-breakpoint
CREATE TABLE `github_user_installations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`installation_id` text NOT NULL,
	`account_login` text NOT NULL,
	`account_id` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_user_installations_installation_unique` ON `github_user_installations` (`installation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_user_installations_user_installation_unique` ON `github_user_installations` (`user_id`,`installation_id`);--> statement-breakpoint
CREATE INDEX `github_user_installations_user_idx` ON `github_user_installations` (`user_id`);--> statement-breakpoint
CREATE TABLE `github_webhook_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`delivery_id` text NOT NULL,
	`event_name` text NOT NULL,
	`action` text,
	`repository_id` text,
	`installation_id` text,
	`status` text NOT NULL,
	`error_code` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`processed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_webhook_events_delivery_unique` ON `github_webhook_events` (`delivery_id`);--> statement-breakpoint
CREATE INDEX `github_webhook_events_status_idx` ON `github_webhook_events` (`status`);--> statement-breakpoint
CREATE TABLE `workspace_github_repository_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`repository_id` integer NOT NULL,
	`connected_by_user_id` integer,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `github_repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connected_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_github_repository_links_workspace_repo_unique` ON `workspace_github_repository_links` (`workspace_id`,`repository_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_github_repository_links_repository_unique` ON `workspace_github_repository_links` (`repository_id`);--> statement-breakpoint
CREATE INDEX `workspace_github_repository_links_workspace_idx` ON `workspace_github_repository_links` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `action_item_prefix` text DEFAULT 'DOW' NOT NULL;