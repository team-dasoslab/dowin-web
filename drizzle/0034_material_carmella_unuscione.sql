ALTER TABLE `daily_logs` ADD `count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `lead_measures` ADD `tracking_mode` text DEFAULT 'BOOLEAN' NOT NULL;--> statement-breakpoint
ALTER TABLE `lead_measures` ADD `daily_target_count` integer DEFAULT 1 NOT NULL;