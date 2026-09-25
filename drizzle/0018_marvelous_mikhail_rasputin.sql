CREATE TABLE `book` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`genre` text NOT NULL,
	`premise` text DEFAULT '' NOT NULL,
	`target_chapters` integer DEFAULT 30 NOT NULL,
	`current_chapter` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`foundations_md` text,
	`chapter_summaries_md` text,
	`pending_hooks_md` text,
	`lock_token` text,
	`lock_heartbeat_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `book_userId_idx` ON `book` (`user_id`);--> statement-breakpoint
CREATE INDEX `book_userId_status_idx` ON `book` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `chapter` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`user_id` text NOT NULL,
	`number` integer NOT NULL,
	`title` text,
	`summary` text DEFAULT '' NOT NULL,
	`content_md` text DEFAULT '' NOT NULL,
	`outline_md` text DEFAULT '' NOT NULL,
	`word_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chapter_bookId_idx` ON `chapter` (`book_id`);--> statement-breakpoint
CREATE INDEX `chapter_userId_idx` ON `chapter` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `chapter_bookId_number_uniq` ON `chapter` (`book_id`,`number`);--> statement-breakpoint
CREATE TABLE `character` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'supporting' NOT NULL,
	`arc_summary` text DEFAULT '' NOT NULL,
	`traits_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `character_bookId_idx` ON `character` (`book_id`);--> statement-breakpoint
CREATE INDEX `character_userId_idx` ON `character` (`user_id`);--> statement-breakpoint
CREATE TABLE `outline` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`order_idx` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `outline_bookId_idx` ON `outline` (`book_id`);--> statement-breakpoint
CREATE INDEX `outline_parentId_idx` ON `outline` (`parent_id`);--> statement-breakpoint
CREATE INDEX `outline_userId_idx` ON `outline` (`user_id`);