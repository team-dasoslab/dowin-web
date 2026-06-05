CREATE TABLE `marketing_invite_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`campaign_name` text NOT NULL,
	`description` text,
	`max_uses` integer NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`granted_seat_count` integer NOT NULL,
	`entitlement_source` text DEFAULT 'BETA_PROMOTIONAL_GRANT' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_by_admin_user_id` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`created_by_admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `marketing_invite_codes_code_unique` ON `marketing_invite_codes` (`code`);--> statement-breakpoint
CREATE INDEX `marketing_invite_codes_status_idx` ON `marketing_invite_codes` (`status`);--> statement-breakpoint
CREATE INDEX `marketing_invite_codes_created_by_admin_idx` ON `marketing_invite_codes` (`created_by_admin_user_id`);--> statement-breakpoint
CREATE TABLE `marketing_invite_redemptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`marketing_invite_code_id` integer NOT NULL,
	`redeemed_by_user_id` integer NOT NULL,
	`workspace_id` integer NOT NULL,
	`redeemed_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`feedback_status` text DEFAULT 'NOT_REQUESTED' NOT NULL,
	`acquisition_source` text DEFAULT 'MARKETING_INVITE' NOT NULL,
	`campaign_name` text NOT NULL,
	`operator_note` text,
	FOREIGN KEY (`marketing_invite_code_id`) REFERENCES `marketing_invite_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `marketing_invite_redemptions_code_user_unique` ON `marketing_invite_redemptions` (`marketing_invite_code_id`,`redeemed_by_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `marketing_invite_redemptions_workspace_unique` ON `marketing_invite_redemptions` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `marketing_invite_redemptions_code_idx` ON `marketing_invite_redemptions` (`marketing_invite_code_id`);--> statement-breakpoint
CREATE INDEX `marketing_invite_redemptions_user_idx` ON `marketing_invite_redemptions` (`redeemed_by_user_id`);