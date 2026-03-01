import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assessments,
  InsertAssessment,
  InsertMilestoneProgress,
  InsertNotification,
  InsertUser,
  milestoneProgress,
  notifications,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── User queries ──

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Assessment queries ──

export async function saveAssessment(data: InsertAssessment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(assessments).values(data);
  return { shareToken: data.shareToken };
}

export async function getAssessmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assessments).where(eq(assessments.userId, userId)).orderBy(desc(assessments.createdAt));
}

export async function getAssessmentByShareToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessments).where(eq(assessments.shareToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAssessmentArtifact(
  id: number,
  artifactText: string,
  verified: "none" | "consistent" | "discrepancies" | "insufficient",
  details: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(assessments)
    .set({ artifactText, artifactVerified: verified, verificationDetails: details })
    .where(eq(assessments.id, id));
}

export async function updateAssessmentGrowthPlan(id: number, growthPlanJson: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assessments).set({ growthPlanJson }).where(eq(assessments.id, id));
}

// ── Notification queries ──

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

// ── Milestone progress queries ──

export async function initMilestones(data: InsertMilestoneProgress[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(milestoneProgress).values(data);
}

export async function getMilestonesByAssessment(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(milestoneProgress)
    .where(
      and(
        eq(milestoneProgress.assessmentId, assessmentId),
        eq(milestoneProgress.userId, userId),
      ),
    )
    .orderBy(milestoneProgress.phaseIndex, milestoneProgress.milestoneIndex);
}

export async function toggleMilestone(id: number, userId: number, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(milestoneProgress)
    .set({
      completed,
      completedAt: completed ? new Date() : null,
    })
    .where(
      and(eq(milestoneProgress.id, id), eq(milestoneProgress.userId, userId)),
    );
}

export async function getPhaseCompletionStatus(assessmentId: number, userId: number, phaseIndex: number) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0 };
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${milestoneProgress.completed} = true then 1 else 0 end)`,
    })
    .from(milestoneProgress)
    .where(
      and(
        eq(milestoneProgress.assessmentId, assessmentId),
        eq(milestoneProgress.userId, userId),
        eq(milestoneProgress.phaseIndex, phaseIndex),
      ),
    );
  return {
    total: result[0]?.total ?? 0,
    completed: result[0]?.completed ?? 0,
  };
}
