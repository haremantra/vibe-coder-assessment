CREATE TABLE `conversation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messages` json NOT NULL,
	`currentAttribute` int NOT NULL DEFAULT 0,
	`internalScores` json,
	`projectSummary` text,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`assessmentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_sessions_id` PRIMARY KEY(`id`)
);
