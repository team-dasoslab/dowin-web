CREATE TABLE `contact_inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'RECEIVED' NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`reply_email` text NOT NULL,
	`consented_at` integer NOT NULL,
	`locale` text DEFAULT 'ko' NOT NULL,
	`source` text DEFAULT 'CONTACT_PAGE' NOT NULL,
	`user_id` integer NOT NULL,
	`workspace_id` integer,
	`discord_delivery_status` text DEFAULT 'PENDING' NOT NULL,
	`discord_failure_reason` text,
	`discord_delivered_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `contact_inquiries_user_idx` ON `contact_inquiries` (`user_id`);--> statement-breakpoint
CREATE INDEX `contact_inquiries_workspace_idx` ON `contact_inquiries` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `contact_inquiries_created_at_idx` ON `contact_inquiries` (`created_at`);
