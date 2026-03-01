CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareToken` varchar(32) NOT NULL,
	`compositeScore` int NOT NULL,
	`compositeTier` varchar(32) NOT NULL,
	`narrative` text NOT NULL,
	`topStrengths` json NOT NULL,
	`criticalGaps` json NOT NULL,
	`scoresJson` json NOT NULL,
	`growthPlanJson` json,
	`transcript` text NOT NULL,
	`artifactText` text,
	`artifactVerified` enum('none','consistent','discrepancies','insufficient') NOT NULL DEFAULT 'none',
	`verificationDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessments_shareToken_unique` UNIQUE(`shareToken`)
);
