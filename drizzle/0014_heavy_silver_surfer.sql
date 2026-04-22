CREATE TABLE `billing_checkout_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`requested_by_user_id` integer NOT NULL,
	`request_id` text NOT NULL,
	`target_plan_code` text NOT NULL,
	`provider` text NOT NULL,
	`provider_checkout_id` text,
	`event_type` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`recorded_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`payload_json` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_checkout_events_workspace_request_event_unique` ON `billing_checkout_events` (`workspace_id`,`request_id`,`event_type`);--> statement-breakpoint
CREATE TABLE `billing_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`provider` text NOT NULL,
	`provider_event_id` text,
	`event_type` text NOT NULL,
	`subscription_key` text,
	`customer_key` text,
	`occurred_at` integer NOT NULL,
	`recorded_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`payload_json` text,
	`status` text DEFAULT 'ACCEPTED' NOT NULL,
	`failure_reason` text,
	`source` text DEFAULT 'WEBHOOK' NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_events_provider_event_unique` ON `billing_events` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE TABLE `workspace_billing_state` (
	`workspace_id` integer PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`billing_status` text DEFAULT 'NONE' NOT NULL,
	`plan_code` text DEFAULT 'FREE' NOT NULL,
	`customer_key` text,
	`subscription_key` text,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`billing_owner_user_id` integer,
	`last_event_id` integer,
	`last_event_occurred_at` integer,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`billing_owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`last_event_id`) REFERENCES `billing_events`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `workspaces` ADD `billing_customer_external_ref` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `billing_owner_user_id` integer REFERENCES users(id);