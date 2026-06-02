PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_marketing_invite_redemptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`marketing_invite_code_id` integer NOT NULL,
	`redeemed_by_user_id` integer NOT NULL,
	`workspace_id` integer,
	`redeemed_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`feedback_status` text DEFAULT 'NOT_REQUESTED' NOT NULL,
	`acquisition_source` text DEFAULT 'MARKETING_INVITE' NOT NULL,
	`campaign_name` text NOT NULL,
	`operator_note` text,
	FOREIGN KEY (`marketing_invite_code_id`) REFERENCES `marketing_invite_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_marketing_invite_redemptions`("id", "marketing_invite_code_id", "redeemed_by_user_id", "workspace_id", "redeemed_at", "feedback_status", "acquisition_source", "campaign_name", "operator_note") SELECT "id", "marketing_invite_code_id", "redeemed_by_user_id", "workspace_id", "redeemed_at", "feedback_status", "acquisition_source", "campaign_name", "operator_note" FROM `marketing_invite_redemptions`;--> statement-breakpoint
DROP TABLE `marketing_invite_redemptions`;--> statement-breakpoint
ALTER TABLE `__new_marketing_invite_redemptions` RENAME TO `marketing_invite_redemptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `marketing_invite_redemptions_code_user_unique` ON `marketing_invite_redemptions` (`marketing_invite_code_id`,`redeemed_by_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `marketing_invite_redemptions_workspace_unique` ON `marketing_invite_redemptions` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `marketing_invite_redemptions_code_idx` ON `marketing_invite_redemptions` (`marketing_invite_code_id`);--> statement-breakpoint
CREATE INDEX `marketing_invite_redemptions_user_idx` ON `marketing_invite_redemptions` (`redeemed_by_user_id`);