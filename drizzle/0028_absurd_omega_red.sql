CREATE TABLE `workspace_seat_entitlements` (
	`workspace_id` integer PRIMARY KEY NOT NULL,
	`plan_code` text NOT NULL,
	`purchased_seat_count` integer NOT NULL,
	`seat_source` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `pending_signup_checkouts` ADD `completed_user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `pending_signup_checkouts` ADD `completed_workspace_id` integer REFERENCES workspaces(id);--> statement-breakpoint
ALTER TABLE `pending_signup_checkouts` ADD `completed_at` integer;