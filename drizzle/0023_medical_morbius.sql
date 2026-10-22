ALTER TABLE `data_report` ADD `user_id` text REFERENCES user(id) ON DELETE cascade;--> statement-breakpoint
CREATE INDEX `data_report_userId_idx` ON `data_report` (`user_id`);