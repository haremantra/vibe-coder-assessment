/**
 * Assessment evaluation router
 * Takes interview transcript → LLM evaluates against rubric → returns scores + personalized growth plan
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

const RUBRIC_CONTEXT = `
# Vibe Coder Self-Assessment Rubric: Attribute-Maturity Matrix

## The Four Maturity Tiers

| Tier | Label | Core Signal |
|------|-------|-------------|
| Tier 1 | Novice | Prompt → paste → ship |
| Tier 2 | Practitioner | Prompt → review → iterate |
| Tier 3 | Senior | Architect first, then prompt |
| Tier 4 | Principal | Shapes the paradigm |

## Attribute 1: Problem Framing
- Tier 1 (Reactive Acceptance): Starts building immediately. AI's interpretation becomes their understanding. Discovers what they're building midway.
- Tier 2 (Clarification Focus): Refines prompts to describe the problem. Documents brief problem statement. Can articulate success criteria.
- Tier 3 (Decomposition and Constraints): Breaks problems into subproblems. Documents constraints. Distinguishes must-have from nice-to-have. Evaluates if stated problem is the right one.
- Tier 4 (Frame Challenging): Challenges the problem framing itself. Grounds definitions in data/evidence. Selects methodologies based on problem structure.

## Attribute 2: Architecture Selection
- Tier 1 (Default Acceptance): Uses first architecture AI suggests. No alternatives evaluated. Can't articulate why this approach.
- Tier 2 (Comparison Awareness): Researches 2-3 alternatives. Selects based on familiarity + requirements. Can name one advantage.
- Tier 3 (Tradeoff Evaluation): Explicitly evaluates tradeoffs across dimensions. Documents why chose this and what was given up. Defensible to technical audience.
- Tier 4 (First-Principles): Designs from first principles. Creates hybrid approaches. Architectural choices create competitive advantages.

## Attribute 3: Scope Discipline
- Tier 1 (Unbounded Expansion): Adds features until time runs out. Can't state in-scope vs out-of-scope. "Done" by exhaustion.
- Tier 2 (Upfront Boundary): Defines target scope before building. Has feature list. Recognizes scope drift.
- Tier 3 (Documented Boundaries): Formal scope boundaries with justification. Must-have vs nice-to-have. Explicit decisions about what not to build.
- Tier 4 (Empirical Stopping): Stopping decisions based on data/evidence. Documented diminishing returns. Resists scope creep with documented reasoning.

## Attribute 4: Iteration Methodology
- Tier 1 (Symptom Chasing): Re-prompts AI without understanding why. Applies fixes without root cause. Repeats same mistakes.
- Tier 2 (Symptom Identification): Clearly describes symptoms. Communicates problems precisely. Verifies fixes. Documents what was broken.
- Tier 3 (Root Cause Analysis): Traces to root causes before fixing. Analyzes why, not just what. Evaluates multiple fix options. Prioritizes by impact.
- Tier 4 (Structured Improvement): Formal improvement cycles with numbered work items. Options analysis per issue. Measures impact before/after.

## Attribute 5: Testing and Validation
- Tier 1 (Manual Only): Clicks through manually. No automated tests. Only happy path. "It didn't crash."
- Tier 2 (Basic Automated): Unit tests for core functions. Happy path coverage. 10-30 tests. Runs tests manually.
- Tier 3 (Integration + Real-Data): Integration tests. Real data fixtures. In-sample vs out-of-sample. Error cases and edge conditions.
- Tier 4 (Experimental Evaluation): Formal validation rubrics. Metrics tracked across phases. Documented failure modes. Statistical properties understood.

## Attribute 6: Documentation and Artifact Quality
- Tier 1 (Code Only): No documentation. Empty README. Relies on memory.
- Tier 2 (Basic Documentation): README with setup + usage. Some comments. High-level description.
- Tier 3 (Architecture + Handoff): Architecture diagrams. API references. Design rationale. Another dev can extend the system.
- Tier 4 (Audience-Differentiated): Multiple layers for different audiences. How-to and why-this-way. Production-ready for handoff.

## Attribute 7: Domain Grounding
- Tier 1 (Domain-Agnostic): Treats all problems as generic software. No domain constraints considered. No research.
- Tier 2 (Basic Awareness): Incorporates domain terminology. Knows basic constraints. References 1-2 domain resources.
- Tier 3 (Standards + Prior Art): Researches domain standards. References industry taxonomies. Positions work relative to prior art.
- Tier 4 (Literature Review): Systematic literature review. Synthesizes academic + industry sources. Identifies gaps. Novel contribution articulated.

## Attribute 8: Production Orientation
- Tier 1 (Session-Only): Works during dev session only. No deployment path. "Works on my machine."
- Tier 2 (Basic Portability): Runs on another machine with instructions. Dependencies documented. Basic packaging.
- Tier 3 (Production-Ready Tooling): CLI/API endpoints. Schema validation. Error handling. Version pinning. Integration points.
- Tier 4 (Deployment + Monetization): Deployment topology documented. Monetization analyzed. Architecture for production properties. Handoff materials prepared.
`;

const evaluationSchema = {
  type: "object" as const,
  properties: {
    scores: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          attribute: { type: "string" as const, description: "Name of the attribute" },
          score: { type: "integer" as const, description: "Tier score 1-4" },
          evidence: { type: "string" as const, description: "Direct quote or paraphrase from the transcript that justifies this score" },
          reasoning: { type: "string" as const, description: "Why this score and not higher or lower" },
        },
        required: ["attribute", "score", "evidence", "reasoning"] as const,
        additionalProperties: false,
      },
      description: "Array of 8 attribute scores",
    },
    compositeScore: { type: "integer" as const, description: "Sum of all 8 attribute scores" },
    compositeTier: { type: "string" as const, enum: ["Novice", "Practitioner", "Senior", "Principal"], description: "Overall maturity tier" },
    narrative: { type: "string" as const, description: "2-3 paragraph narrative explaining the overall assessment, strengths, and growth edges. Reference the user's specific project and answers." },
    topStrengths: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Top 2-3 strengths identified from the interview",
    },
    criticalGaps: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Top 2-3 critical gaps that should be addressed first",
    },
  },
  required: ["scores", "compositeScore", "compositeTier", "narrative", "topStrengths", "criticalGaps"] as const,
  additionalProperties: false,
};

const growthPlanSchema = {
  type: "object" as const,
  properties: {
    currentTier: { type: "string" as const },
    targetTier: { type: "string" as const },
    primaryFocus: { type: "string" as const, description: "One sentence describing the main growth focus" },
    phases: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          phase: { type: "string" as const, enum: ["0-30 days", "30-60 days", "60-90 days"] },
          theme: { type: "string" as const, description: "Theme for this phase" },
          objectives: {
            type: "array" as const,
            items: { type: "string" as const },
            description: "2-3 specific objectives for this phase",
          },
          project: {
            type: "object" as const,
            properties: {
              title: { type: "string" as const },
              description: { type: "string" as const, description: "What to build and why, referencing the user's actual project and gaps" },
              deliverables: {
                type: "array" as const,
                items: { type: "string" as const },
                description: "Concrete deliverables to produce",
              },
              successCriteria: {
                type: "array" as const,
                items: { type: "string" as const },
                description: "How to know this project is done well",
              },
            },
            required: ["title", "description", "deliverables", "successCriteria"] as const,
            additionalProperties: false,
          },
          instructions: {
            type: "array" as const,
            items: { type: "string" as const },
            description: "Step-by-step instructions for executing this phase. Be specific and actionable.",
          },
        },
        required: ["phase", "theme", "objectives", "project", "instructions"] as const,
        additionalProperties: false,
      },
    },
  },
  required: ["currentTier", "targetTier", "primaryFocus", "phases"] as const,
  additionalProperties: false,
};

export const assessmentRouter = router({
  evaluate: publicProcedure
    .input(z.object({
      transcript: z.string().min(50, "Transcript too short"),
    }))
    .mutation(async ({ input }) => {
      const { transcript } = input;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert engineering assessor evaluating a vibe coder's maturity level. You have deep expertise in software engineering practices, system design, and AI-assisted development.

You will be given an interview transcript where a vibe coder described their actual work on a recent project. Your job is to score them on 8 attributes using the rubric below.

SCORING RULES:
- Score based on DEMONSTRATED behavior in the transcript, not aspirational statements
- If the person says "I should have done X" or "next time I'll do X", that does NOT count as evidence for X
- If they are between two tiers, score at the LOWER tier. Maturity is about reliable, repeatable behavior.
- Short or vague answers with no specifics indicate lower tiers
- Specific examples, named tools, concrete artifacts indicate higher tiers
- Be rigorous but fair. Do not inflate scores.

${RUBRIC_CONTEXT}`,
          },
          {
            role: "user",
            content: `Here is the interview transcript. Score this person on all 8 attributes.

${transcript}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "assessment_evaluation",
            strict: true,
            schema: evaluationSchema,
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("LLM returned empty response");
      }

      return JSON.parse(content);
    }),

  generateGrowthPlan: publicProcedure
    .input(z.object({
      transcript: z.string(),
      evaluation: z.object({
        scores: z.array(z.object({
          attribute: z.string(),
          score: z.number(),
          evidence: z.string(),
          reasoning: z.string(),
        })),
        compositeScore: z.number(),
        compositeTier: z.string(),
        narrative: z.string(),
        topStrengths: z.array(z.string()),
        criticalGaps: z.array(z.string()),
      }),
    }))
    .mutation(async ({ input }) => {
      const { transcript, evaluation } = input;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior engineering mentor creating a personalized 30-60-90 day growth plan for a vibe coder. You have their interview transcript and assessment scores.

IMPORTANT RULES:
- The growth plan MUST reference the user's SPECIFIC project and gaps from the transcript
- Projects should be PURE VIBE CODING focused — assume system design over IDE coding, prototype deployed to Vercel or similar
- Each phase should build on the previous one
- Instructions should be concrete and actionable — not generic advice
- The plan should target moving them from their current tier toward the next tier
- For Principal tier (already at top), focus on shipping, scaling, and publishing
- Projects should be things they can build with AI assistance, not traditional coding exercises
- Focus on the PROCESS and ARTIFACTS, not just the code output`,
          },
          {
            role: "user",
            content: `Create a personalized 30-60-90 day growth plan.

## Assessment Results
- Composite Tier: ${evaluation.compositeTier} (Score: ${evaluation.compositeScore}/32)
- Top Strengths: ${evaluation.topStrengths.join(", ")}
- Critical Gaps: ${evaluation.criticalGaps.join(", ")}

## Per-Attribute Scores
${evaluation.scores.map(s => `- ${s.attribute}: ${s.score}/4 — ${s.reasoning}`).join("\n")}

## Interview Transcript
${transcript}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "growth_plan",
            strict: true,
            schema: growthPlanSchema,
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("LLM returned empty response");
      }

      return JSON.parse(content);
    }),
});
