CREATE TABLE `pending_signup_checkouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`request_id` text NOT NULL,
	`custom_id` text NOT NULL,
	`nickname` text NOT NULL,
	`password_hash` text NOT NULL,
	`locale` text NOT NULL,
	`workspace_name` text NOT NULL,
	`requested_seat_count` integer NOT NULL,
	`target_plan_code` text NOT NULL,
	`provider` text NOT NULL,
	`provider_product_id` text NOT NULL,
	`provider_checkout_id` text,
	`checkout_url` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pending_signup_checkouts_uid_unique` ON `pending_signup_checkouts` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `pending_signup_checkouts_request_unique` ON `pending_signup_checkouts` (`request_id`);--> statement-breakpoint
CREATE INDEX `pending_signup_checkouts_custom_status_idx` ON `pending_signup_checkouts` (`custom_id`,`status`);--> statement-breakpoint
CREATE INDEX `pending_signup_checkouts_expires_at_idx` ON `pending_signup_checkouts` (`expires_at`);