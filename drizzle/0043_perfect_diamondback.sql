PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_github_installation_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state` text NOT NULL,
	`user_id` integer NOT NULL,
	`workspace_id` integer,
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
INSERT INTO `__new_github_installation_states`("id", "state", "user_id", "workspace_id", "locale", "installation_id", "setup_action", "status", "expires_at", "created_at", "completed_at") SELECT "id", "state", "user_id", "workspace_id", "locale", "installation_id", "setup_action", "status", "expires_at", "created_at", "completed_at" FROM `github_installation_states`;--> statement-breakpoint
DROP TABLE `github_installation_states`;--> statement-breakpoint
ALTER TABLE `__new_github_installation_states` RENAME TO `github_installation_states`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `github_installation_states_state_unique` ON `github_installation_states` (`state`);--> statement-breakpoint
CREATE INDEX `github_installation_states_user_idx` ON `github_installation_states` (`user_id`);--> statement-breakpoint
CREATE INDEX `github_installation_states_workspace_idx` ON `github_installation_states` (`workspace_id`);