CREATE TABLE `basic_usage_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`actor_user_id` integer,
	`target_user_id` integer,
	`lead_measure_id` integer,
	`event_type` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `basic_usage_events_workspace_occurred_idx` ON `basic_usage_events` (`workspace_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `team_checkin_adjustment_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`workspace_id` integer NOT NULL,
	`actor_user_id` integer,
	`event_type` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `team_checkin_adjustment_proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `team_checkin_adjustment_audit_logs_proposal_idx` ON `team_checkin_adjustment_audit_logs` (`proposal_id`);--> statement-breakpoint
CREATE TABLE `team_checkin_adjustment_proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`workspace_id` integer NOT NULL,
	`source_delivery_id` integer NOT NULL,
	`source_response_id` integer NOT NULL,
	`leader_user_id` integer NOT NULL,
	`member_user_id` integer NOT NULL,
	`lead_measure_id` integer NOT NULL,
	`action_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`leader_note` text,
	`status` text DEFAULT 'PROPOSED' NOT NULL,
	`expires_at` integer NOT NULL,
	`responded_at` integer,
	`applied_at` integer,
	`apply_error_code` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_delivery_id`) REFERENCES `team_checkin_deliveries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_response_id`) REFERENCES `team_checkin_responses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`leader_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_checkin_adjustment_proposals_uid_unique` ON `team_checkin_adjustment_proposals` (`uid`);--> statement-breakpoint
CREATE INDEX `team_checkin_adjustment_proposals_workspace_status_idx` ON `team_checkin_adjustment_proposals` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `team_checkin_adjustment_proposals_member_status_idx` ON `team_checkin_adjustment_proposals` (`member_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `team_checkin_adjustment_proposals_response_idx` ON `team_checkin_adjustment_proposals` (`source_response_id`);--> statement-breakpoint
CREATE TABLE `team_checkin_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`workspace_id` integer NOT NULL,
	`member_user_id` integer NOT NULL,
	`lead_measure_id` integer NOT NULL,
	`scoreboard_id` integer NOT NULL,
	`reason_code` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`scheduled_for` integer NOT NULL,
	`sent_at` integer,
	`send_status` text DEFAULT 'PENDING' NOT NULL,
	`skip_reason` text,
	`message_title` text NOT NULL,
	`message_body` text NOT NULL,
	`deeplink_path` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_measure_id`) REFERENCES `lead_measures`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scoreboard_id`) REFERENCES `scoreboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_checkin_deliveries_uid_unique` ON `team_checkin_deliveries` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_checkin_deliveries_period_unique` ON `team_checkin_deliveries` (`workspace_id`,`member_user_id`,`lead_measure_id`,`reason_code`,`period_start`);--> statement-breakpoint
CREATE INDEX `team_checkin_deliveries_workspace_period_idx` ON `team_checkin_deliveries` (`workspace_id`,`period_start`);--> statement-breakpoint
CREATE INDEX `team_checkin_deliveries_member_created_idx` ON `team_checkin_deliveries` (`member_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `team_checkin_deliveries_measure_created_idx` ON `team_checkin_deliveries` (`lead_measure_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `team_checkin_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`delivery_id` integer NOT NULL,
	`workspace_id` integer NOT NULL,
	`member_user_id` integer NOT NULL,
	`response_type` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `team_checkin_deliveries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_checkin_responses_uid_unique` ON `team_checkin_responses` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_checkin_responses_delivery_unique` ON `team_checkin_responses` (`delivery_id`);--> statement-breakpoint
CREATE INDEX `team_checkin_responses_workspace_created_idx` ON `team_checkin_responses` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `workspace_team_checkin_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`include_admin_as_member` integer DEFAULT false NOT NULL,
	`trigger_no_weekly_log_enabled` integer DEFAULT true NOT NULL,
	`trigger_slow_start_enabled` integer DEFAULT true NOT NULL,
	`daily_member_limit` integer DEFAULT 2 NOT NULL,
	`daily_workspace_limit` integer DEFAULT 30 NOT NULL,
	`quiet_start_hour` integer,
	`quiet_end_hour` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_team_checkin_settings_workspace_unique` ON `workspace_team_checkin_settings` (`workspace_id`);