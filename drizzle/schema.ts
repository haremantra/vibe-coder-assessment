import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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
 * Stores the full evaluation from the chat assessment flow.
 * Per-attribute scores stored as JSON; composite score/tier as first-class columns for querying.
 */
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to users table */
  userId: int("userId").notNull(),
  /** Unique share token for public sharing (not the user ID for privacy) */
  shareToken: varchar("shareToken", { length: 32 }).notNull().unique(),
  /** Composite score (8-32) */
  compositeScore: int("compositeScore").notNull(),
  /** Overall maturity tier */
  compositeTier: varchar("compositeTier", { length: 32 }).notNull(),
  /** LLM-generated narrative summary */
  narrative: text("narrative").notNull(),
  /** Top strengths identified */
  topStrengths: json("topStrengths").notNull(),
  /** Critical gaps identified */
  criticalGaps: json("criticalGaps").notNull(),
  /** Per-attribute scores array: [{attribute, score, evidence, reasoning}] */
  scoresJson: json("scoresJson").notNull(),
  /** Full growth plan JSON */
  growthPlanJson: json("growthPlanJson"),
  /** Full interview transcript */
  transcript: text("transcript").notNull(),
  /** Optional: uploaded artifact text for verification */
  artifactText: text("artifactText"),
  /** Artifact verification status */
  artifactVerified: mysqlEnum("artifactVerified", ["none", "consistent", "discrepancies", "insufficient"]).default("none").notNull(),
  /** Artifact verification details from LLM */
  verificationDetails: text("verificationDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;
