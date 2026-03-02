import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Assessment results table.
 */
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  shareToken: varchar("shareToken", { length: 32 }).notNull().unique(),
  compositeScore: int("compositeScore").notNull(),
  compositeTier: varchar("compositeTier", { length: 32 }).notNull(),
  narrative: text("narrative").notNull(),
  topStrengths: json("topStrengths").notNull(),
  criticalGaps: json("criticalGaps").notNull(),
  scoresJson: json("scoresJson").notNull(),
  growthPlanJson: json("growthPlanJson"),
  transcript: text("transcript").notNull(),
  artifactText: text("artifactText"),
  artifactVerified: mysqlEnum("artifactVerified", ["none", "consistent", "discrepancies", "insufficient"]).default("none").notNull(),
  verificationDetails: text("verificationDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

/**
 * In-app notifications table.
 * Stores notifications for users (assessment complete, phase complete, reassess reminder).
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Notification type for filtering and icon selection */
  type: mysqlEnum("type", [
    "assessment_complete",
    "phase_complete",
    "plan_complete",
    "reassess_reminder",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  /** Optional link to navigate to when notification is clicked */
  actionUrl: varchar("actionUrl", { length: 512 }),
  /** Optional reference to an assessment */
  assessmentId: int("assessmentId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Milestone progress tracking for growth plan phases.
 * Each row tracks one milestone within one phase of one assessment's growth plan.
 */
export const milestoneProgress = mysqlTable("milestone_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Reference to the assessment whose growth plan this tracks */
  assessmentId: int("assessmentId").notNull(),
  /** Phase index (0 = 0-30 days, 1 = 30-60 days, 2 = 60-90 days) */
  phaseIndex: int("phaseIndex").notNull(),
  /** Milestone index within the phase */
  milestoneIndex: int("milestoneIndex").notNull(),
  /** The milestone text (denormalized for display without loading full growth plan) */
  milestoneText: text("milestoneText").notNull(),
  /** Whether this milestone is completed */
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MilestoneProgress = typeof milestoneProgress.$inferSelect;
export type InsertMilestoneProgress = typeof milestoneProgress.$inferInsert;

/**
 * Conversation sessions for LLM-driven chat assessment.
 * Stores in-progress and completed conversations so users can resume.
 */
export const conversationSessions = mysqlTable("conversation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Full conversation history as JSON array of {role, content} messages */
  messages: json("messages").notNull(),
  /** Current attribute being assessed (1-8), 0 = opening, 9 = closing */
  currentAttribute: int("currentAttribute").default(0).notNull(),
  /** Internal per-attribute scores as they are assigned during conversation */
  internalScores: json("internalScores"),
  /** The project description echoed back for anchoring */
  projectSummary: text("projectSummary"),
  /** Session status */
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  /** Reference to the assessment created when session completes */
  assessmentId: int("assessmentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = typeof conversationSessions.$inferInsert;
