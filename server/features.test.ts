import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock helpers ──

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-openid",
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
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Feature 1: Database Persistence Tests ──

describe("assessment.save", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assessment.save({
        transcript: "A test transcript that is long enough to pass validation for the save endpoint",
        evaluation: {
          scores: [
            { attribute: "Problem Framing", score: 2, evidence: "test", reasoning: "test" },
            { attribute: "Architecture Selection", score: 2, evidence: "test", reasoning: "test" },
            { attribute: "Scope Discipline", score: 2, evidence: "test", reasoning: "test" },
            { attribute: "Iteration Methodology", score: 2, evidence: "test", reasoning: "test" },
            { attribute: "Testing & Validation", score: 2, evidence: "test", reasoning: "test" },
            { attribute: "Documentation & Artifacts", score: 2, evidence: "test", reasoning: "test" },
            { attribute: "Domain Grounding", score: 2, evidence: "test", reasoning: "test" },
            { attribute: "Production Orientation", score: 2, evidence: "test", reasoning: "test" },
          ],
          compositeScore: 16,
          compositeTier: "Practitioner",
          narrative: "Test narrative",
          topStrengths: ["strength1"],
          criticalGaps: ["gap1"],
        },
      })
    ).rejects.toThrow();
  });
});

// ── Feature 2: Artifact Verification Tests ──

describe("assessment.verifyArtifact", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assessment.verifyArtifact({
        shareToken: "test-token",
        artifactText: "# My Project README\n\nThis is a test artifact with enough content to pass validation.",
      })
    ).rejects.toThrow();
  });

  it("rejects artifact text that is too short", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assessment.verifyArtifact({
        shareToken: "test-token",
        artifactText: "too short",
      })
    ).rejects.toThrow();
  });
});

// ── Feature 3: Share Token Tests ──

describe("assessment.getByShareToken", () => {
  it("returns null for non-existent token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assessment.getByShareToken({
      token: "nonexistent-token-12345",
    });

    expect(result).toBeNull();
  });

  it("accepts any token string without auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw — this is a public endpoint
    const result = await caller.assessment.getByShareToken({
      token: "any-valid-string",
    });

    // Returns null because token doesn't exist, but no auth error
    expect(result).toBeNull();
  });
});

// ── Assessment History Tests ──

describe("assessment.history", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.assessment.history()).rejects.toThrow();
  });
});

// ── Evaluate Endpoint Tests ──

describe("assessment.evaluate", () => {
  it("rejects transcript that is too short", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assessment.evaluate({ transcript: "too short" })
    ).rejects.toThrow();
  });
});

// ── Growth Plan Endpoint Tests ──

describe("assessment.generateGrowthPlan", () => {
  it("rejects when evaluation is missing required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Completely missing evaluation should throw a Zod validation error (no LLM call)
    await expect(
      caller.assessment.generateGrowthPlan({
        transcript: "test",
      } as any)
    ).rejects.toThrow();
  });
});

// ── Upload Artifact Tests ──

describe("assessment.uploadArtifact", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assessment.uploadArtifact({
        fileName: "README.md",
        fileContent: "# Test",
        mimeType: "text/markdown",
      })
    ).rejects.toThrow();
  });
});
