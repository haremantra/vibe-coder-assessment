CREATE TABLE `milestone_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`phaseIndex` int NOT NULL,
	`milestoneIndex` int NOT NULL,
	`milestoneText` text NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `milestone_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('assessment_complete','phase_complete','plan_complete','reassess_reminder') NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`actionUrl` varchar(512),
	`assessmentId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
