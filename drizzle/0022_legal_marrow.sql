CREATE TABLE `data_report` (
	`id` text PRIMARY KEY NOT NULL,
	`model_id` text,
	`kind` text NOT NULL,
	`detail` text NOT NULL,
	`source_url` text,
	`email` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `data_report_createdAt_idx` ON `data_report` (`created_at`);