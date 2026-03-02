/**
 * Assessment router — LLM-driven conversational assessment
 *
 * Architecture:
 * - startSession: creates or resumes a conversation session (auth-gated)
 * - chat: sends user message → LLM → returns bot response (auth-gated)
 * - abandonSession: marks a session as abandoned
 * - getActiveSession: checks for resumable sessions
 *
 * Preserved endpoints:
 * - history, getByShareToken, verifyArtifact, generateGrowthPlan, updateGrowthPlan, uploadArtifact
 */

import { z } from "zod";
import { nanoid } from "nanoid";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  saveAssessment,
  getAssessmentsByUser,
  getAssessmentByShareToken,
  getAssessmentById,
  updateAssessmentArtifact,
  updateAssessmentGrowthPlan,
  createNotification,
  saveConversationSession,
  getConversationSession,
  getActiveSessionForUser,
  updateConversationSession,
} from "./db";
import { getDb } from "./db";
import { assessments } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";

// ── System Prompt ──
// This is the full OptionA Chatbot Assessment Design script, embedded as the system prompt.
// The LLM drives the entire conversation — branching, scoring, transitions, and closing.

const SYSTEM_PROMPT = `You are a professional technical assessor conducting a structured behavioral interview to evaluate a software developer's "vibe coding" maturity. You are assessing the user against the Vibe Coder Self-Assessment Rubric: an 8-attribute, 4-tier maturity matrix.

## YOUR ROLE AND BEHAVIOR

You are warm but precise. You acknowledge what the user says without evaluating it ("Thanks — that's helpful context" not "Great answer!"). You never reveal tier names, scores, or rubric structure during the conversation. You never say "Tier 1" or "Tier 4" or mention scoring. You ask about ONE project throughout the entire conversation.

You MUST follow the conversation script below exactly. Do not skip attributes. Do not combine questions. Ask ONE question at a time and wait for the user's response before proceeding.

## ANTI-GAMING RULES

- If the user gives abstract or hypothetical answers ("generally I do X", "I usually..."), redirect: "That's helpful context — can you point me to a specific moment from this project where that happened?"
- If the user gives very short answers (under 15 words), ask ONE clarifying follow-up: "Could you walk me through that in a bit more detail?"
- Never accept "I should have done X" or "next time I'll do X" as evidence of actual behavior.
- If the user tries to ask you questions about the rubric or scoring, deflect: "I'll share your full results at the end. For now, let's keep focusing on your project."

## CONVERSATION STRUCTURE

The conversation has 4 phases:
1. OPENING: Welcome, ground rules, project selection, project confirmation echo-back
2. ATTRIBUTE PROBING: 8 attributes in order, 2-4 questions each based on branching
3. CLOSING: Score calculation and structured reveal
4. GROWTH PRIORITIES: Top 2 growth areas with specific actions

## OPENING SEQUENCE

Start with this welcome (adapt naturally, don't read verbatim):
"Welcome to the Vibe Coder Self-Assessment. This will take about 15-25 minutes, and you'll receive scores across 8 dimensions of vibe coding maturity.

One important ground rule: I'm going to ask you about a specific project you've worked on recently. I want you to reflect on what you actually did — not what you wish you'd done or plan to do next time. If the honest answer is 'I didn't do that,' just say so. There are no wrong answers.

Think of a recent project that represents your typical way of working. What project comes to mind? Give me a brief description — what it was and what it was trying to do."

After the user describes a project, echo back a one-sentence summary:
"Got it — [your summary of their project]. I'll use this as our reference point throughout. Every question will be about what you actually did on this specific project."

Then say: "Let's get into it." and proceed to Attribute 1.

## ATTRIBUTE PROBING SCRIPT

For each attribute, follow the branching logic below. ALWAYS start with the Primary Question. Based on the user's response, route to the appropriate branch using the trigger signals. Apply LOWER-TIER DISCIPLINE on all boundary calls — if between two tiers, score the lower one.

### ATTRIBUTE 1: PROBLEM FRAMING
Primary: "Starting at the very beginning of that project: before you wrote your first prompt or generated any code, what did you do first?"

Branch A triggers (Tier 1-2 signals): Started building immediately, opened IDE, started prompting, "just knew what I wanted," no pre-work mentioned
Branch A follow-up: "When during the project did you first feel clearly settled on exactly what you were building — before you started, partway through, or once it was mostly done?"
- "Before I started" but no specific artifact → Tier 1
- "Partway through" or "once mostly done" → Tier 1

Branch B triggers (Tier 2-3 signals): Writing something down, making notes, defining a goal, problem statement, thinking through success criteria
Branch B follow-up: "What did that pre-work look like in practice — was it something you wrote down, or more of a mental process before you started prompting?"
- "Mental only" → ask: "Were you able to articulate what success would look like before your first prompt?" If yes → Tier 2. If no → Tier 1.
- "Wrote something down" → ask: "What did that written artifact contain — was it more of a goal statement, or did it go further into breaking down sub-problems and constraints?"
  - Goal statement / problem description → Tier 2
  - Sub-problems / constraints / non-goals → Tier 3. Move to Tier 4 probe.

Tier 3-4 probe: "At any point before you started building, did you question whether the problem framing itself was correct — whether the problem you were planning to solve was actually the right problem?"
- "No" or kept original framing → Tier 3
- "Yes, and changed problem statement based on research/evidence" → Tier 4

Transition: "Thanks — that gives me a clear picture of how you entered that project. Now I want to shift to the technical decisions you made."

### ATTRIBUTE 2: ARCHITECTURE SELECTION
Primary: "Walk me through how the technology decision happened for this project — your stack, your tools, your overall structure. What was the sequence of events that led to those choices?"

Branch A triggers (Tier 1-2): "Used what AI suggested," "used what I know," no alternatives considered
Branch A follow-up: "Did you consider any alternative approaches before committing, or did you go with this stack from the start?"
- No alternatives → Tier 1
- Considered one or two → ask: "What made you pick this over the others?" Familiarity → Tier 2. Specific advantage → Tier 2.

Branch B triggers (Tier 2-3): "Looked at options," "compared approaches," mentions weighing
Branch B follow-up: "When you were comparing those options, what specific tradeoffs were you weighing?"
- One vague tradeoff → Tier 2
- 2+ specific tradeoffs → ask: "Did you document that tradeoff analysis anywhere?" Mental only → Tier 2. Documented → Tier 3.

Branch C triggers (Tier 3-4): "Evaluated tradeoffs," "designed from scratch," "unconventional approach"
Tier 4 probe: "Was the architecture you chose a fairly standard approach for this type of problem, or did you deliberately diverge from what you'd typically see?"
- Standard → Tier 3
- Diverged with post-hoc rationale → Tier 3
- Diverged with pre-design first-principles reasoning → Tier 4

Transition: "That's helpful context on how you navigated the technology decisions. Now let's talk about the scope of what you built."

### ATTRIBUTE 3: SCOPE DISCIPLINE
Primary: "How did you decide what was NOT going to be in this project — what were the things you looked at and said 'that's out of scope'?"

Branch A triggers (Tier 1-2): "Didn't think about it," "just built what seemed right," "it kept growing"
Branch A follow-up: "Was there a point where you could clearly describe what 'done' looked like — or did it keep growing until you ran out of time?"
- Kept growing / ran out of time → Tier 1
- Had rough sense but shifted → Tier 1 (unless can name original feature list → Tier 2)

Branch B triggers (Tier 2-3): "Had a feature list," "knew roughly what was in vs. out," mentions a boundary
Branch B follow-up: "Was that feature boundary written down somewhere, or was it primarily in your head?"
- In head → Tier 2
- Written → ask: "Beyond listing what was in scope, did you also document what was explicitly out of scope and why?"
  - Only in-scope → Tier 2
  - Out-of-scope section → Tier 3
  - Out-of-scope with reasons → Tier 3. Move to Tier 4 probe.

Tier 4 probe: "When you decided to stop expanding the project, was that based on completing a defined list, or on some kind of analysis — like additional features weren't adding enough value?"
- Completed list → Tier 3
- Analyzed diminishing returns / measured saturation → Tier 4

Transition: "Good — now I want to move into the building phase. Things always go wrong during development."

### ATTRIBUTE 4: ITERATION METHODOLOGY
Primary: "Think about a specific moment during this project when something broke or didn't work the way you expected. What did you do immediately after you hit that problem?"

Branch A triggers (Tier 1-2): "Tried changing things until it worked," "re-prompted the AI," "not sure why it worked"
Branch A follow-up: "Once it was working again, did you understand why it had broken in the first place?"
- Moved on / not sure → Tier 1
- Understood what broke → ask: "Did you write down what was wrong and how you fixed it?" Mental only → Tier 2. Wrote it down → Tier 2.

Branch B triggers (Tier 2-3): "Described error clearly," "figured out what was wrong first," "isolated the problem"
Branch B follow-up: "When you identified what was wrong, did you consider multiple ways to fix it, or did you go with the most obvious solution?"
- Obvious fix → Tier 2
- Multiple options → ask: "Was that comparison written down?" Mental → Tier 2. Written → Tier 3.

Branch C triggers (Tier 3-4): "Traced to root cause," "analyzed why," "tracked as work item"
Tier 4 probe: "Did you track issues in any structured way — numbered work items, priority labels — and did you measure anything before and after a fix?"
- No formal tracking → Tier 3
- Tracking but no measurement → Tier 3
- Formal tracking with before/after measurement → Tier 4

Transition: "Useful — that tells me how you respond when things go sideways. Now let's talk about how you verified that things were going right."

### ATTRIBUTE 5: TESTING AND VALIDATION
Primary: "If I looked at your project folder or repository right now, what would I find in terms of tests or validation — what exists there to verify that the project works correctly?"

Branch A triggers (Tier 1-2): "Nothing really," "I ran it and it worked," "tested manually," no test files
Branch A follow-up: "When you ran the project manually, what specifically were you checking — just the main use case, or did you try to break it with edge cases?"
- Main use case / happy path → Tier 1
- Tried variations → Tier 1 (no automation = Tier 1 regardless of manual thoroughness)

Branch B triggers (Tier 2-3): "Test files exist," "wrote unit tests," mentions testing framework
Branch B follow-up: "Roughly how many tests are there, and what do they cover — primarily unit tests, or do they go beyond that?"
- Fewer than 10 / just a few → Tier 2
- 10-30 tests / main features → Tier 2
- Integration tests / 30+ → ask: "Did your tests use real data or realistic fixtures?" Synthetic → Tier 2. Real data → ask about separate validation set. Same data → Tier 3. Separate validation → ask about metrics. No metrics → Tier 3. Tracked metrics → Tier 4.

Transition: "That gives me a clear picture of your validation approach. Now I want to understand what you left behind."

### ATTRIBUTE 6: DOCUMENTATION AND ARTIFACT QUALITY
Primary: "If someone who had never seen this project before picked up your repository right now, what would they find to help them understand what it is, how to use it, and why you built it the way you did?"

Branch A triggers (Tier 1-2): "Just the code," "default README," "not much"
Branch A follow-up: "Is there at least a README — and if so, what does it contain?"
- No README / empty → Tier 1
- Some content → ask: "Does the README cover how to install and run the project, and does it explain design choices?" Just what it does → Tier 1. Setup + usage → Tier 2. Setup + usage + design decisions → Tier 3 signal.

Branch B triggers (Tier 2-3): "README with setup instructions," "basic docs," "some comments"
Branch B follow-up: "Beyond the README, is there anything else — a design document, architecture diagram, or document explaining why you made the choices you made?"
- Just README → Tier 2
- Additional design doc / architecture explanation → Tier 3.

Branch C triggers (Tier 3-4): "Multiple documents," "architecture doc," "design decisions documented"
Tier 4 probe: "Who were you writing these documents for — yourself and other developers, or were there documents aimed at different audiences?"
- Developers only → Tier 3
- Multiple audiences → ask: "Is there a pitch deck, investor brief, or business model summary alongside the technical docs?" No → Tier 3. Yes → Tier 4.

Transition: "Good. I want to shift now to the knowledge you brought into this project from outside."

### ATTRIBUTE 7: DOMAIN GROUNDING
Primary: "This project existed in some kind of problem space or domain. During the project, was there a point where you looked at how others had already solved similar problems — and if so, what did that look like?"

Branch A triggers (Tier 1): "No," "didn't look at others," "built it my own way"
Branch A follow-up: "Was this a domain you already knew well, or were you approaching it as a generic software problem?"
- Generic / domain wasn't relevant → Tier 1
- Knew domain but didn't research → Tier 1-2 boundary. If domain constraints informed design → Tier 2. Otherwise → Tier 1.

Branch B triggers (Tier 2): "Looked at a couple things," "knew the basics," "used domain terms"
Branch B follow-up: "Did that translate into specific constraints or requirements in your design, or was it more background context?"
- Background context → Tier 2
- Specific constraints → Tier 2. Move to Tier 3 probe.

Branch C triggers (Tier 3-4): "Researched existing solutions," "referenced standards," "compared approaches"
Tier 3 probe: "Did you reference any formal standards, industry frameworks, or established taxonomies — and did you document how your approach compares to what already exists?"
- No formal standards → Tier 2
- Referenced standards, no comparison doc → Tier 3
- Referenced standards AND documented comparison → Tier 4 probe: "Can you point to something your approach does that existing solutions don't?" Not really → Tier 3. Systematic review + novel contribution → Tier 4.

Transition: "Last area — and this one is about the life of the project beyond your development environment."

### ATTRIBUTE 8: PRODUCTION ORIENTATION
Primary: "After finishing this project, who could actually run it — just you on your specific machine, another developer who reads your setup instructions, or people with no technical background using a deployed version?"

Branch A triggers (Tier 1): "Just me," "specific to my machine"
Branch A follow-up: "Are dependencies documented anywhere — requirements.txt, package.json, or similar?"
- No → Tier 1
- Yes → ask: "Has anyone else actually run your code successfully?" No → Tier 1-2. Yes → Tier 2.

Branch B triggers (Tier 2): "Another developer could run it," "README with instructions"
Branch B follow-up: "Does the project have a defined interface — CLI, REST API, or named integration points?"
- No formal interface → Tier 2
- CLI or API → ask: "Does it handle bad inputs gracefully — validation, error messages?" Assumes well-formed → Tier 2. Has error handling → Tier 3.

Branch C triggers (Tier 3-4): "Deployed," "has an API," "anyone can access it"
Tier 4 probe: "Have you thought through deployment topology — containerization, service architecture — or analyzed the business model for how this could generate value?"
- Not really → Tier 3
- Deployment config OR business model (one only) → Tier 3
- BOTH deployment architecture AND business model → Tier 4

## CLOSING SEQUENCE

After completing Attribute 8, say: "That covers all eight areas. Let me put together your results."

Then calculate scores and output the results. You MUST include a machine-readable JSON block in this EXACT format on its own line:

ASSESSMENT_COMPLETE_JSON:
{"scores":{"problemFraming":N,"architectureSelection":N,"scopeDiscipline":N,"iterationMethodology":N,"testingValidation":N,"documentationArtifacts":N,"domainGrounding":N,"productionOrientation":N},"compositeScore":N,"compositeTier":"Novice|Practitioner|Senior|Principal","narrative":"2-3 paragraph interpretation","topStrengths":["attr1","attr2"],"criticalGaps":["attr1","attr2"],"gapActions":["specific action for gap 1","specific action for gap 2"]}

Tier ranges: 8-13 = Novice, 14-19 = Practitioner, 20-25 = Senior, 26-32 = Principal.

After the JSON block, present the results conversationally:
1. State the total score and tier name
2. Show the 8-attribute breakdown (attribute name: score/4)
3. Give the tier-specific interpretation (see below)
4. State the two highest-leverage growth priorities with specific actions
5. Mention the reassessment cadence (every 10-15 projects or 6 months)
6. End with "Good luck on the next build."

### Tier-Specific Interpretations:

If Novice (8-13): Your score reflects early-stage vibe coding — you're generating working software, which is a real skill. The growth edge is shifting from "prompt and see what happens" to "think before you prompt." The single highest-leverage change is writing a one-paragraph problem statement before your next project begins. Not a design doc — just a paragraph that captures what you're building, who it's for, and what success looks like. That paragraph will change how you prompt, what you build, and how you evaluate the result. Your 90-day target is reaching a score of 14 or above.

If Practitioner (14-19): Your score shows you're reviewing, iterating, and understanding what you build. The growth edge is shifting from reactive iteration to proactive architecture — thinking through structure before you start prompting. Your highest-leverage action is writing a design document before your next project. One page that captures your problem statement, the architecture you're choosing and why, and what's explicitly out of scope. Your 90-day target is reaching a score of 20 or above.

If Senior (20-25): Your score reflects a practitioner who architects before prompting, documents decisions with reasoning, and builds systems rather than scripts. The growth edge is broadening your impact beyond your own projects. Publishing one artifact, open-sourcing one module, or writing one technical post about a non-obvious decision will push you into Principal territory. Your 90-day target is reaching a score of 26 or above.

If Principal (26-32): Your score puts you in the top tier — grounding decisions in evidence, designing for production, and building with impact beyond the immediate project. The growth edge is execution and scale. Close your largest execution gap: if you design but don't deploy, learn infrastructure. If you build but don't monetize, learn business models. If you build but don't publish, start writing. Your 90-day target is shipping something others use, pay for, or cite.

## CRITICAL RULES

1. Ask ONE question at a time. Never combine questions.
2. Never reveal tiers, scores, or rubric structure during probing.
3. Never use evaluative language ("great answer," "that's impressive"). Use neutral acknowledgments.
4. Always apply lower-tier discipline on boundary calls.
5. Always redirect abstract answers back to the specific project.
6. Keep transitions brisk between attributes. Don't over-explain.
7. If the user gives a very short or unclear answer, ask ONE clarifying follow-up before scoring.
8. Track scores internally. Never share them until the closing sequence.
9. The ASSESSMENT_COMPLETE_JSON block must appear exactly once, at the end, after all 8 attributes are scored.
10. The JSON must be valid and parseable. Use double quotes for all keys and string values.`;

// ── Rubric context for standalone evaluation endpoints ──

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
- Tier 1: Starts building immediately. AI's interpretation becomes their understanding.
- Tier 2: Refines prompts. Documents brief problem statement. Can articulate success criteria.
- Tier 3: Breaks problems into subproblems. Documents constraints. Distinguishes must-have from nice-to-have.
- Tier 4: Challenges the problem framing itself. Grounds definitions in data/evidence.

## Attribute 2: Architecture Selection
- Tier 1: Uses first architecture AI suggests. No alternatives evaluated.
- Tier 2: Researches 2-3 alternatives. Selects based on familiarity + requirements.
- Tier 3: Explicitly evaluates tradeoffs across dimensions. Documents reasoning.
- Tier 4: Designs from first principles. Creates hybrid approaches.

## Attribute 3: Scope Discipline
- Tier 1: Adds features until time runs out. Can't state in-scope vs out-of-scope.
- Tier 2: Defines target scope before building. Has feature list.
- Tier 3: Formal scope boundaries with justification. Explicit decisions about what not to build.
- Tier 4: Stopping decisions based on data/evidence. Documented diminishing returns.

## Attribute 4: Iteration Methodology
- Tier 1: Re-prompts AI without understanding why. Applies fixes without root cause.
- Tier 2: Clearly describes symptoms. Verifies fixes. Documents what was broken.
- Tier 3: Traces to root causes. Analyzes why, not just what. Evaluates multiple fix options.
- Tier 4: Formal improvement cycles. Options analysis per issue. Measures impact before/after.

## Attribute 5: Testing and Validation
- Tier 1: Manual only. No automated tests. Only happy path.
- Tier 2: Unit tests for core functions. Happy path coverage. 10-30 tests.
- Tier 3: Integration tests. Real data fixtures. Error cases and edge conditions.
- Tier 4: Formal validation rubrics. Metrics tracked across phases. Statistical properties.

## Attribute 6: Documentation and Artifact Quality
- Tier 1: No documentation. Empty README.
- Tier 2: README with setup + usage. Some comments.
- Tier 3: Architecture diagrams. API references. Design rationale.
- Tier 4: Multiple layers for different audiences. Production-ready for handoff.

## Attribute 7: Domain Grounding
- Tier 1: Treats all problems as generic software. No domain research.
- Tier 2: Incorporates domain terminology. Knows basic constraints.
- Tier 3: Researches domain standards. References industry taxonomies.
- Tier 4: Systematic literature review. Novel contribution articulated.

## Attribute 8: Production Orientation
- Tier 1: Works during dev session only. No deployment path.
- Tier 2: Runs on another machine with instructions. Dependencies documented.
- Tier 3: CLI/API endpoints. Schema validation. Error handling.
- Tier 4: Deployment topology documented. Monetization analyzed.
`;

// ── JSON schemas for structured LLM responses ──

const evaluationSchema = {
  type: "object" as const,
  properties: {
    scores: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          attribute: { type: "string" as const },
          score: { type: "integer" as const },
          evidence: { type: "string" as const },
          reasoning: { type: "string" as const },
        },
        required: ["attribute", "score", "evidence", "reasoning"] as const,
        additionalProperties: false,
      },
    },
    compositeScore: { type: "integer" as const },
    compositeTier: { type: "string" as const, enum: ["Novice", "Practitioner", "Senior", "Principal"] },
    narrative: { type: "string" as const },
    topStrengths: { type: "array" as const, items: { type: "string" as const } },
    criticalGaps: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["scores", "compositeScore", "compositeTier", "narrative", "topStrengths", "criticalGaps"] as const,
  additionalProperties: false,
};

const growthPlanSchema = {
  type: "object" as const,
  properties: {
    currentTier: { type: "string" as const },
    targetTier: { type: "string" as const },
    primaryFocus: { type: "string" as const },
    phases: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          phase: { type: "string" as const, enum: ["0-30 days", "30-60 days", "60-90 days"] },
          theme: { type: "string" as const },
          objectives: { type: "array" as const, items: { type: "string" as const } },
          project: {
            type: "object" as const,
            properties: {
              title: { type: "string" as const },
              description: { type: "string" as const },
              deliverables: { type: "array" as const, items: { type: "string" as const } },
              successCriteria: { type: "array" as const, items: { type: "string" as const } },
            },
            required: ["title", "description", "deliverables", "successCriteria"] as const,
            additionalProperties: false,
          },
          instructions: { type: "array" as const, items: { type: "string" as const } },
        },
        required: ["phase", "theme", "objectives", "project", "instructions"] as const,
        additionalProperties: false,
      },
    },
  },
  required: ["currentTier", "targetTier", "primaryFocus", "phases"] as const,
  additionalProperties: false,
};

const verificationSchema = {
  type: "object" as const,
  properties: {
    status: { type: "string" as const, enum: ["consistent", "discrepancies", "insufficient"] },
    summary: { type: "string" as const },
    consistentClaims: { type: "array" as const, items: { type: "string" as const } },
    discrepancies: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          claim: { type: "string" as const },
          artifact: { type: "string" as const },
          impact: { type: "string" as const },
        },
        required: ["claim", "artifact", "impact"] as const,
        additionalProperties: false,
      },
    },
    scoreAdjustments: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          attribute: { type: "string" as const },
          originalScore: { type: "integer" as const },
          adjustedScore: { type: "integer" as const },
          reason: { type: "string" as const },
        },
        required: ["attribute", "originalScore", "adjustedScore", "reason"] as const,
        additionalProperties: false,
      },
    },
  },
  required: ["status", "summary", "consistentClaims", "discrepancies", "scoreAdjustments"] as const,
  additionalProperties: false,
};

// ── Zod schemas ──

const evaluationZod = z.object({
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
});

// ── Helper: extract ASSESSMENT_COMPLETE_JSON from bot message ──

function extractAssessmentJson(text: string): Record<string, unknown> | null {
  // Try the explicit marker first
  const markerIdx = text.indexOf("ASSESSMENT_COMPLETE_JSON:");
  if (markerIdx !== -1) {
    const after = text.substring(markerIdx + 25);
    const braceStart = after.indexOf("{");
    if (braceStart !== -1) {
      let depth = 0;
      for (let i = braceStart; i < after.length; i++) {
        if (after[i] === "{") depth++;
        if (after[i] === "}") depth--;
        if (depth === 0) {
          try {
            return JSON.parse(after.substring(braceStart, i + 1));
          } catch { break; }
        }
      }
    }
  }

  // Fallback: look for any large JSON object with "compositeScore"
  const jsonRegex = /\{[\s\S]*?"compositeScore"[\s\S]*?\}/;
  const match = text.match(jsonRegex);
  if (match) {
    // Find the balanced braces
    const start = text.indexOf(match[0]);
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.substring(start, i + 1));
        } catch { break; }
      }
    }
  }

  return null;
}

// ── Helper: strip JSON block from display text ──

function stripAssessmentJson(text: string): string {
  // Remove the ASSESSMENT_COMPLETE_JSON: {...} block
  return text
    .replace(/ASSESSMENT_COMPLETE_JSON:\s*\{[\s\S]*?\}\s*/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Router ──

export const assessmentRouter = router({
  // ── LLM Conversation Endpoints (auth-gated) ──

  startSession: protectedProcedure.mutation(async ({ ctx }) => {
    // Check for an active session the user can resume
    const existing = await getActiveSessionForUser(ctx.user.id);
    if (existing) {
      const msgs = existing.messages as Array<{ role: string; content: string }>;
      return {
        sessionId: existing.id,
        messages: msgs.filter((m) => m.role !== "system"),
        resumed: true,
      };
    }

    // Create new session with the scripted opening message from the design doc.
    // We don't call the LLM here — the opening is deterministic per the chatbot script.
    const botMessage = `Welcome to the Vibe Coder Maturity Assessment. I'm going to ask you about a recent project you've built — not hypotheticals, but what you actually did.

This takes about 15-20 minutes. I'll walk through several aspects of how you work, and at the end you'll get a detailed score breakdown with a personalized growth plan.

To start: **Tell me about a project you've worked on recently.** What was it, and what problem were you trying to solve?`;

    const systemMessages = [{ role: "system" as const, content: SYSTEM_PROMPT }];

    const allMessages = [
      ...systemMessages,
      { role: "assistant" as const, content: botMessage },
    ];

    const sessionId = await saveConversationSession({
      userId: ctx.user.id,
      messages: allMessages,
      currentAttribute: 0,
      status: "in_progress",
    });

    return {
      sessionId,
      messages: [{ role: "assistant", content: botMessage }],
      resumed: false,
    };
  }),

  chat: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getConversationSession(input.sessionId);
      if (!session || session.userId !== ctx.user.id) {
        throw new Error("Session not found");
      }
      if (session.status !== "in_progress") {
        throw new Error("This assessment session has already been completed");
      }

      const messages = session.messages as Array<{ role: string; content: string }>;
      messages.push({ role: "user", content: input.message });

      // Call LLM with retry-then-save fallback
      let response;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          response = await invokeLLM({
            messages: messages.map((m) => ({
              role: m.role as "system" | "user" | "assistant",
              content: m.content,
            })),
          });
          break;
        } catch (err) {
          retryCount++;
          if (retryCount > maxRetries) {
            // Save the user's message so progress isn't lost
            await updateConversationSession(input.sessionId, { messages });
            throw new Error(
              "The assessment service is temporarily unavailable. Your progress has been saved — you can resume where you left off."
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        }
      }

      const botContent =
        (response?.choices?.[0]?.message?.content as string) ||
        "I'm sorry, could you repeat that? I want to make sure I understand your response.";

      messages.push({ role: "assistant", content: botContent });

      // Check if the assessment is complete
      const evaluationResult = extractAssessmentJson(botContent);
      const isComplete = evaluationResult !== null && "compositeScore" in evaluationResult;

      // Estimate progress from user message count
      const userMessageCount = messages.filter((m) => m.role === "user").length;
      const estimatedAttribute = Math.min(8, Math.max(0, Math.floor((userMessageCount - 1) / 2.5)));

      // Update session
      await updateConversationSession(input.sessionId, {
        messages,
        currentAttribute: isComplete ? 9 : estimatedAttribute,
        status: isComplete ? "completed" : "in_progress",
      });

      // If complete, save the assessment to the database
      let savedAssessmentId: number | null = null;
      let shareToken: string | null = null;

      if (isComplete && evaluationResult) {
        try {
          shareToken = nanoid(16);

          // Build transcript from non-system messages
          const transcript = messages
            .filter((m) => m.role !== "system")
            .map((m) => `${m.role === "user" ? "User" : "Assessor"}: ${m.content}`)
            .join("\n\n");

          const scores = (evaluationResult as Record<string, unknown>).scores || {};
          const compositeScore =
            (evaluationResult as Record<string, unknown>).compositeScore as number ||
            (typeof scores === "object" && scores !== null
              ? Object.values(scores as Record<string, number>).reduce((a, b) => a + b, 0)
              : 8);

          await saveAssessment({
            userId: ctx.user.id,
            shareToken,
            compositeScore,
            compositeTier: ((evaluationResult as Record<string, unknown>).compositeTier as string) || "Novice",
            narrative: ((evaluationResult as Record<string, unknown>).narrative as string) || "",
            topStrengths: ((evaluationResult as Record<string, unknown>).topStrengths as string[]) || [],
            criticalGaps: ((evaluationResult as Record<string, unknown>).criticalGaps as string[]) || [],
            scoresJson: scores,
            transcript,
          });

          // Get the saved assessment ID
          const db = await getDb();
          if (db) {
            const saved = await db
              .select({ id: assessments.id })
              .from(assessments)
              .where(eq(assessments.shareToken, shareToken))
              .limit(1);
            savedAssessmentId = saved[0]?.id ?? null;
          }

          // Update session with assessment reference
          if (savedAssessmentId) {
            await updateConversationSession(input.sessionId, {
              assessmentId: savedAssessmentId,
            });
          }

          // Fire notification
          await createNotification({
            userId: ctx.user.id,
            type: "assessment_complete",
            title: `Assessment Complete: ${(evaluationResult as Record<string, unknown>).compositeTier}`,
            body: `You scored ${compositeScore}/32 (${(evaluationResult as Record<string, unknown>).compositeTier} tier). View your results and generate a personalized growth plan.`,
            actionUrl: `/share/${shareToken}`,
            assessmentId: savedAssessmentId,
          });
        } catch (err) {
          console.error("[Assessment] Failed to save results:", err);
          // Don't throw — the conversation completed even if save failed
        }
      }

      // Strip the JSON block from the display message
      const displayContent = isComplete ? stripAssessmentJson(botContent) : botContent;

      return {
        content: displayContent,
        isComplete,
        evaluation: isComplete ? evaluationResult : null,
        assessmentId: savedAssessmentId,
        shareToken,
        progress: isComplete ? 1 : Math.min(0.95, userMessageCount / 22),
        currentAttribute: isComplete ? 9 : estimatedAttribute,
      };
    }),

  abandonSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const session = await getConversationSession(input.sessionId);
      if (!session || session.userId !== ctx.user.id) {
        throw new Error("Session not found");
      }
      await updateConversationSession(input.sessionId, { status: "abandoned" });
      return { success: true };
    }),

  getActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const session = await getActiveSessionForUser(ctx.user.id);
    if (!session) return null;
    const msgs = session.messages as Array<{ role: string; content: string }>;
    return {
      sessionId: session.id,
      currentAttribute: session.currentAttribute,
      messageCount: msgs.filter((m) => m.role !== "system").length,
      updatedAt: session.updatedAt,
    };
  }),

  // ── Preserved Endpoints ──

  evaluate: publicProcedure
    .input(z.object({ transcript: z.string().min(50) }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert engineering assessor. Score the following interview transcript on 8 attributes using the rubric. Score based on DEMONSTRATED behavior, not aspirational statements. Apply lower-tier discipline on boundary calls.\n\n${RUBRIC_CONTEXT}`,
          },
          { role: "user", content: `Score this transcript:\n\n${input.transcript}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "assessment_evaluation", strict: true, schema: evaluationSchema },
        },
      });
      const content = response?.choices?.[0]?.message?.content as string | undefined;
      if (!content) throw new Error("LLM returned empty response");
      return JSON.parse(content);
    }),

  generateGrowthPlan: protectedProcedure
    .input(z.object({ transcript: z.string(), evaluation: evaluationZod }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior engineering mentor creating a personalized 30-60-90 day growth plan. Projects should be PURE VIBE CODING focused — assume system design over IDE coding, prototype deployed to Vercel or similar. Reference the user's SPECIFIC project and gaps from the transcript.`,
          },
          {
            role: "user",
            content: `Create a growth plan.\n\nTier: ${input.evaluation.compositeTier} (${input.evaluation.compositeScore}/32)\nGaps: ${input.evaluation.criticalGaps.join(", ")}\nScores: ${input.evaluation.scores.map((s) => `${s.attribute}: ${s.score}/4`).join(", ")}\n\nTranscript:\n${input.transcript}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "growth_plan", strict: true, schema: growthPlanSchema },
        },
      });
      const content = response?.choices?.[0]?.message?.content as string | undefined;
      if (!content) throw new Error("LLM returned empty response");
      return JSON.parse(content);
    }),

  save: protectedProcedure
    .input(z.object({
      transcript: z.string(),
      evaluation: evaluationZod,
      growthPlan: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const shareToken = nanoid(16);
      await saveAssessment({
        userId: ctx.user.id,
        shareToken,
        compositeScore: input.evaluation.compositeScore,
        compositeTier: input.evaluation.compositeTier,
        narrative: input.evaluation.narrative,
        topStrengths: input.evaluation.topStrengths,
        criticalGaps: input.evaluation.criticalGaps,
        scoresJson: input.evaluation.scores,
        growthPlanJson: input.growthPlan ?? null,
        transcript: input.transcript,
      });
      const db = await getDb();
      let assessmentId: number | undefined;
      if (db) {
        const saved = await db.select({ id: assessments.id }).from(assessments).where(eq(assessments.shareToken, shareToken)).limit(1);
        assessmentId = saved[0]?.id;
      }
      await createNotification({
        userId: ctx.user.id,
        type: "assessment_complete",
        title: `Assessment Complete: ${input.evaluation.compositeTier}`,
        body: `You scored ${input.evaluation.compositeScore}/32 (${input.evaluation.compositeTier} tier).`,
        actionUrl: `/share/${shareToken}`,
        assessmentId: assessmentId ?? null,
      });
      return { shareToken, assessmentId };
    }),

  updateGrowthPlan: protectedProcedure
    .input(z.object({ shareToken: z.string(), growthPlan: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await getAssessmentByShareToken(input.shareToken);
      if (!assessment) throw new Error("Assessment not found");
      if (assessment.userId !== ctx.user.id) throw new Error("Not authorized");
      await updateAssessmentGrowthPlan(assessment.id, input.growthPlan);
      return { success: true };
    }),

  history: protectedProcedure.query(async ({ ctx }) => {
    const results = await getAssessmentsByUser(ctx.user.id);
    return results.map((r) => ({
      id: r.id,
      shareToken: r.shareToken,
      compositeScore: r.compositeScore,
      compositeTier: r.compositeTier,
      createdAt: r.createdAt,
      artifactVerified: r.artifactVerified,
      growthPlanJson: r.growthPlanJson,
      scoresJson: r.scoresJson,
    }));
  }),

  getByShareToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const assessment = await getAssessmentByShareToken(input.token);
      if (!assessment) return null;
      return {
        compositeScore: assessment.compositeScore,
        compositeTier: assessment.compositeTier,
        narrative: assessment.narrative,
        topStrengths: assessment.topStrengths as string[],
        criticalGaps: assessment.criticalGaps as string[],
        scores: assessment.scoresJson as Array<{ attribute: string; score: number; evidence: string; reasoning: string }>,
        growthPlan: assessment.growthPlanJson,
        artifactVerified: assessment.artifactVerified,
        verificationDetails: assessment.verificationDetails,
        createdAt: assessment.createdAt,
      };
    }),

  verifyArtifact: protectedProcedure
    .input(z.object({ shareToken: z.string(), artifactText: z.string().min(20) }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await getAssessmentByShareToken(input.shareToken);
      if (!assessment) throw new Error("Assessment not found");
      if (assessment.userId !== ctx.user.id) throw new Error("Not authorized");
      const scores = assessment.scoresJson as Array<{ attribute: string; score: number; evidence: string; reasoning: string }>;
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an artifact verification engine. Cross-reference interview claims against the artifact. Be specific about which attributes are affected.\n\n${RUBRIC_CONTEXT}`,
          },
          {
            role: "user",
            content: `Scores:\n${scores.map((s) => `${s.attribute}: ${s.score}/4 — "${s.evidence}"`).join("\n")}\n\nTranscript:\n${assessment.transcript}\n\nArtifact:\n${input.artifactText}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "artifact_verification", strict: true, schema: verificationSchema },
        },
      });
      const content = response?.choices?.[0]?.message?.content as string | undefined;
      if (!content) throw new Error("LLM returned empty response");
      const verification = JSON.parse(content);
      await updateAssessmentArtifact(assessment.id, input.artifactText, verification.status, JSON.stringify(verification));
      return verification;
    }),

  uploadArtifact: protectedProcedure
    .input(z.object({ fileName: z.string(), fileContent: z.string(), mimeType: z.string().default("text/plain") }))
    .mutation(async ({ ctx, input }) => {
      const key = `artifacts/${ctx.user.id}/${nanoid(8)}-${input.fileName}`;
      const { url } = await storagePut(key, input.fileContent, input.mimeType);
      return { url, key };
    }),
});
