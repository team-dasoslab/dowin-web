PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_workspace_billing_state` (
	`workspace_id` integer PRIMARY KEY NOT NULL,
	`provider` text,
	`billing_status` text DEFAULT 'NONE' NOT NULL,
	`plan_code` text DEFAULT 'FREE' NOT NULL,
	`entitlement_source` text,
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
INSERT INTO `__new_workspace_billing_state`("workspace_id", "provider", "billing_status", "plan_code", "entitlement_source", "customer_key", "subscription_key", "current_period_end", "cancel_at_period_end", "billing_owner_user_id", "last_event_id", "last_event_occurred_at", "updated_at") SELECT "workspace_id", "provider", "billing_status", "plan_code", "entitlement_source", "customer_key", "subscription_key", "current_period_end", "cancel_at_period_end", "billing_owner_user_id", "last_event_id", "last_event_occurred_at", "updated_at" FROM `workspace_billing_state`;--> statement-breakpoint
DROP TABLE `workspace_billing_state`;--> statement-breakpoint
ALTER TABLE `__new_workspace_billing_state` RENAME TO `workspace_billing_state`;--> statement-breakpoint
PRAGMA foreign_keys=ON;