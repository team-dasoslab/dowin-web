CREATE TABLE `billing_provider_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`environment` text NOT NULL,
	`plan_code` text NOT NULL,
	`provider_product_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_provider_products_provider_env_plan_unique` ON `billing_provider_products` (`provider`,`environment`,`plan_code`);