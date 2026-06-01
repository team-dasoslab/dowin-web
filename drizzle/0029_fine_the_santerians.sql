CREATE TABLE `pending_workspace_checkouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`request_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`locale` text NOT NULL,
	`workspace_name` text NOT NULL,
	`requested_seat_count` integer NOT NULL,
	`target_plan_code` text NOT NULL,
	`provider` text NOT NULL,
	`provider_product_id` text NOT NULL,
	`provider_checkout_id` text,
	`checkout_url` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`completed_workspace_id` integer,
	`completed_at` integer,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`completed_workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pending_workspace_checkouts_uid_unique` ON `pending_workspace_checkouts` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `pending_workspace_checkouts_request_unique` ON `pending_workspace_checkouts` (`request_id`);--> statement-breakpoint
CREATE INDEX `pending_workspace_checkouts_user_status_idx` ON `pending_workspace_checkouts` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `pending_workspace_checkouts_expires_at_idx` ON `pending_workspace_checkouts` (`expires_at`);