/**
 * Tests for Round 2 features:
 * - Notification router (list, markRead, markAllRead)
 * - Milestone router (init, toggle, phaseStatus)
 * - Assessment history endpoint (includes growthPlanJson, scoresJson)
 */

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-round2",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("notification router", () => {
  it("notification.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.list()).rejects.toThrow();
  });

  it("notification.unreadCount requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.unreadCount()).rejects.toThrow();
  });

  it("notification.markRead requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.markRead({ id: 1 })).rejects.toThrow();
  });

  it("notification.markAllRead requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.markAllRead()).rejects.toThrow();
  });

  it("notification.list returns array for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notification.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("notification.unreadCount returns number for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notification.unreadCount();
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("milestone router", () => {
  it("milestone.init requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.milestone.init({
        assessmentId: 1,
        milestones: [{ phaseIndex: 0, milestoneIndex: 0, milestoneText: "Test" }],
      }),
    ).rejects.toThrow();
  });

  it("milestone.getByAssessment requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.milestone.getByAssessment({ assessmentId: 1 }),
    ).rejects.toThrow();
  });

  it("milestone.toggle requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.milestone.toggle({
        milestoneId: 1,
        completed: true,
        assessmentId: 1,
        phaseIndex: 0,
      }),
    ).rejects.toThrow();
  });

  it("milestone.phaseStatus requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.milestone.phaseStatus({ assessmentId: 1 }),
    ).rejects.toThrow();
  });

  it("milestone.getByAssessment returns array for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.milestone.getByAssessment({ assessmentId: 999 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("milestone.phaseStatus returns 3 phases for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.milestone.phaseStatus({ assessmentId: 999 });
    expect(result).toHaveLength(3);
    result.forEach((phase: any) => {
      expect(phase).toHaveProperty("total");
      expect(phase).toHaveProperty("completed");
    });
  });

  it("milestone.init validates input schema", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Empty milestones array should still work (no-op)
    const result = await caller.milestone.init({
      assessmentId: 999,
      milestones: [],
    });
    // Should return without error — empty array is valid
    expect(result).toBeDefined();
  });
});

describe("assessment history endpoint", () => {
  it("history requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.assessment.history()).rejects.toThrow();
  });

  it("history returns array with expected fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.assessment.history();
    expect(Array.isArray(result)).toBe(true);
    // If there are results, verify the shape includes new fields
    if (result.length > 0) {
      const first = result[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("compositeScore");
      expect(first).toHaveProperty("compositeTier");
      expect(first).toHaveProperty("scoresJson");
      expect(first).toHaveProperty("growthPlanJson");
      expect(first).toHaveProperty("shareToken");
      expect(first).toHaveProperty("createdAt");
    }
  });
});

describe("router structure", () => {
  it("notification router is registered on appRouter", () => {
    expect(appRouter._def.procedures).toHaveProperty("notification.list");
    expect(appRouter._def.procedures).toHaveProperty("notification.unreadCount");
    expect(appRouter._def.procedures).toHaveProperty("notification.markRead");
    expect(appRouter._def.procedures).toHaveProperty("notification.markAllRead");
  });

  it("milestone router is registered on appRouter", () => {
    expect(appRouter._def.procedures).toHaveProperty("milestone.init");
    expect(appRouter._def.procedures).toHaveProperty("milestone.getByAssessment");
    expect(appRouter._def.procedures).toHaveProperty("milestone.toggle");
    expect(appRouter._def.procedures).toHaveProperty("milestone.phaseStatus");
  });
});
