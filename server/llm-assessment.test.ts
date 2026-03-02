import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Test Helpers ──

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user = {
    id: userId,
    openId: `test-user-${userId}`,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// ── Tests ──

describe("LLM Assessment Refactoring", () => {
  describe("Auth gating", () => {
    it("startSession requires authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.assessment.startSession()).rejects.toThrow();
    });

    it("chat requires authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.chat({ sessionId: 1, message: "test" })
      ).rejects.toThrow();
    });

    it("abandonSession requires authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.abandonSession({ sessionId: 1 })
      ).rejects.toThrow();
    });

    it("getActiveSession requires authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.assessment.getActiveSession()).rejects.toThrow();
    });

    it("generateGrowthPlan requires authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.generateGrowthPlan({
          transcript: "test transcript with enough characters to pass validation",
          evaluation: {
            compositeScore: 16,
            compositeTier: "Practitioner",
            narrative: "Test narrative",
            topStrengths: ["strength1"],
            criticalGaps: ["gap1"],
            scores: [
              { attribute: "Problem Framing", score: 2, evidence: "e", reasoning: "r" },
            ],
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("Public endpoints remain public", () => {
    it("evaluate endpoint exists as a public procedure", () => {
      // Verify the evaluate endpoint is registered in the router
      const routerShape = appRouter._def.procedures;
      expect(routerShape).toHaveProperty("assessment.evaluate");
    });

    it("getByShareToken is accessible without auth", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Should return null for non-existent token, not throw auth error
      const result = await caller.assessment.getByShareToken({
        token: "nonexistent-token",
      });
      expect(result).toBeNull();
    });
  });

  describe("Input validation", () => {
    it("chat rejects empty messages", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.chat({ sessionId: 1, message: "" })
      ).rejects.toThrow();
    });

    it("chat rejects messages over 5000 chars", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.chat({ sessionId: 1, message: "a".repeat(5001) })
      ).rejects.toThrow();
    });

    it("evaluate rejects transcripts under 50 chars", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.evaluate({ transcript: "too short" })
      ).rejects.toThrow();
    });

    it("verifyArtifact rejects artifacts under 20 chars", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.verifyArtifact({
          shareToken: "test",
          artifactText: "too short",
        })
      ).rejects.toThrow();
    });
  });

  describe("Session management", () => {
    it("abandonSession rejects non-existent session", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.abandonSession({ sessionId: 999999 })
      ).rejects.toThrow("Session not found");
    });

    it("chat rejects non-existent session", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.assessment.chat({ sessionId: 999999, message: "test message" })
      ).rejects.toThrow("Session not found");
    });
  });

  describe("System prompt structure", () => {
    it("assessment router has all required endpoints", () => {
      // Verify the router shape includes all expected procedures
      const routerShape = appRouter._def.procedures;
      
      expect(routerShape).toHaveProperty("assessment.startSession");
      expect(routerShape).toHaveProperty("assessment.chat");
      expect(routerShape).toHaveProperty("assessment.abandonSession");
      expect(routerShape).toHaveProperty("assessment.getActiveSession");
      expect(routerShape).toHaveProperty("assessment.evaluate");
      expect(routerShape).toHaveProperty("assessment.generateGrowthPlan");
      expect(routerShape).toHaveProperty("assessment.save");
      expect(routerShape).toHaveProperty("assessment.history");
      expect(routerShape).toHaveProperty("assessment.getByShareToken");
      expect(routerShape).toHaveProperty("assessment.verifyArtifact");
      expect(routerShape).toHaveProperty("assessment.uploadArtifact");
      expect(routerShape).toHaveProperty("assessment.updateGrowthPlan");
    });
  });

  describe("Notification and milestone routers preserved", () => {
    it("notification router endpoints exist", () => {
      const routerShape = appRouter._def.procedures;
      expect(routerShape).toHaveProperty("notification.list");
      expect(routerShape).toHaveProperty("notification.markRead");
      expect(routerShape).toHaveProperty("notification.unreadCount");
    });

    it("milestone router endpoints exist", () => {
      const routerShape = appRouter._def.procedures;
      expect(routerShape).toHaveProperty("milestone.getByAssessment");
      expect(routerShape).toHaveProperty("milestone.toggle");
    });
  });
});
