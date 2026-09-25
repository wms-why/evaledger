CREATE TABLE `ai_provider` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`model` text NOT NULL,
	`base_url_override` text,
	`enabled` integer DEFAULT true NOT NULL,
	`priority` integer NOT NULL,
	`max_tokens_cap` integer,
	`last_error` text,
	`last_error_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_provider_kind_model_uniq` ON `ai_provider` (`kind`,`model`);--> statement-breakpoint
CREATE INDEX `ai_provider_priority_idx` ON `ai_provider` (`enabled`,`priority`);