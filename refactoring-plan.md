# Refactoring Plan: LLM-Driven Chatbot Assessment

**Document Purpose:** This plan compares the current implementation against the OptionA Chatbot Assessment Design specification and categorizes every required change as **MUST** (breaks correctness or violates the design contract), **SHOULD** (materially improves accuracy or user experience), or **DISCRETIONARY** (polish, optimization, or future-proofing).

**Scope:** The refactoring moves the assessment from a client-side deterministic state machine with keyword-based branching to an LLM-driven conversational flow where the model handles branch routing, follow-up selection, and per-attribute scoring in real-time — while the structured question protocol from the design document serves as the system prompt and scoring rubric.

---

## 1. Executive Summary

The current implementation splits responsibility across three layers: a client-side state machine (`interviewData.ts`) that deterministically selects questions, a keyword-based `classifyResponse()` function that routes between two follow-up branches per attribute, and a post-hoc LLM evaluation endpoint that scores the full transcript after the interview completes. The new design document specifies a fundamentally different architecture: the LLM is the interviewer, performing real-time branch routing based on trigger signal interpretation, with up to 4 questions per attribute (not a fixed 2), multi-branch trees (A/B/C, not binary), and per-attribute scoring embedded in the conversation flow.

The table below summarizes the gap at each layer.

| Layer | Current State | Target State | Gap Severity |
|---|---|---|---|
| **Question Content** | Generic behavioral questions, loosely mapped to rubric | CoVE-validated questions with anti-gaming framing, past-tense behavioral anchoring | MUST change |
| **Branching Model** | Binary (depth vs. awareness), 2 questions per attribute | Multi-branch (A/B/C), 2-4 questions per attribute, tier-specific probes | MUST change |
| **Branch Routing** | Client-side keyword matching (`classifyResponse()`) | LLM interprets response against trigger signal lists | MUST change |
| **Scoring Timing** | Deferred to post-hoc LLM evaluation of full transcript | Per-attribute scoring during conversation (internal), revealed at end | SHOULD change |
| **Opening Sequence** | 2 grounding questions, no confirmation loop | Welcome → ground rules → project selection → project confirmation (echo-back) | MUST change |
| **Closing Sequence** | LLM generates narrative + growth plan separately | Structured score reveal → tier interpretation → growth priorities → reassessment note | SHOULD change |
| **Transition Language** | No transitions between attributes | Neutral acknowledgment + bridge sentence per attribute | SHOULD change |
| **Ambiguity Handling** | Defaults to lower branch on short/negative responses | Lower-tier discipline on all boundary calls, with explicit confirmation probes | MUST change |
| **Gaming Mitigation** | None | Past-tense framing, artifact-specific follow-ups, "if I looked" phrasing | SHOULD change |
| **Question Count** | Fixed 18 (2 grounding + 8×2 probing) | Variable 16-32 (2-4 per attribute depending on tier boundary) | MUST change |
| **Frontend Chat UI** | Works, but tightly coupled to state machine | Must decouple from state machine, become a pure chat client | MUST change |
| **Backend Evaluation** | Single post-hoc LLM call | Streaming conversation with per-turn LLM calls for routing + scoring | MUST change |
| **Database/History/Share/Milestones** | Fully built and working | No changes required — these are downstream consumers of evaluation output | No change |

---

## 2. MUST Change — Breaks Correctness or Violates the Design Contract

These changes are non-negotiable. Without them, the app does not implement the specified design.

### 2.1 Replace Client-Side State Machine with Server-Side LLM Conversation

**Current:** `interviewData.ts` defines a deterministic state machine. The client calls `getCurrentQuestion()` and `advanceState()` locally. No server involvement until the interview is complete.

**Target:** The server manages conversation state. Each user message is sent to a tRPC endpoint, which passes the full conversation history plus the design document's system prompt to the LLM. The LLM decides which question to ask next, which branch to take, and when to move to the next attribute. The client becomes a thin chat interface.

**What changes:**

| File | Action | Detail |
|---|---|---|
| `client/src/lib/interviewData.ts` | **Retire** | No longer drives the interview. May be kept as reference data but is not called at runtime. |
| `server/assessment.ts` | **New endpoint: `chat`** | A stateful tRPC mutation that accepts the user's latest message + conversation history, calls the LLM with the full chatbot script as system context, and returns the bot's next message + internal metadata (current attribute, branch, provisional score). |
| `client/src/pages/ChatAssessment.tsx` | **Major rewrite** | Remove all `interviewData` imports and state machine logic. Replace with a simple chat loop: user types → call `trpc.assessment.chat.mutate()` → display bot response. Progress tracking comes from server metadata, not client-side state counting. |

**Why MUST:** The design document explicitly states that LLM routing outperforms keyword routing because "user responses are often compound — containing signals for multiple tiers simultaneously." The current `classifyResponse()` function cannot handle compound signals, adjacent-tier ambiguity, or the multi-branch trees specified in the design.

### 2.2 Replace All 8 Primary Questions with CoVE-Validated Versions

**Current questions vs. design document questions:**

| Attribute | Current Primary Question | Design Document Primary Question |
|---|---|---|
| 1. Problem Framing | "Before you started building, did you write anything down about the problem you were solving?" | "Before you wrote your first prompt or generated any code on this project — what did you do first?" |
| 2. Architecture Selection | "What tech stack or architecture did you use? How did you arrive at that choice?" | "Walk me through how the technology decision happened — what was the sequence of events that led to those choices?" |
| 3. Scope Discipline | "Did the project end up being what you originally planned, or did it change along the way?" | "How did you decide what was *not* going to be in this project — what were the things you looked at and said 'that's out of scope'?" |
| 4. Iteration Methodology | "When something wasn't working during development, how did you figure out what was wrong and fix it?" | "Think about a specific moment during this project when something broke or didn't work the way you expected. What did you do immediately after?" |
| 5. Testing & Validation | "Does this project have tests? Tell me about your testing approach." | "If I looked at your project folder or repository right now, what would I find in terms of tests or validation?" |
| 6. Documentation | "If I cloned your project right now, what documentation would I find?" | "If someone who had never seen this project picked up your repository right now, what would they find to help them understand what it is, how to use it, and why you built it the way you did?" |
| 7. Domain Grounding | "How much did you know about the problem domain before starting?" | "This project existed in some kind of problem space. Was there a point where you looked at how others had already solved similar problems — and if so, what did that look like?" |
| 8. Production Orientation | "Is this project deployed and usable by someone other than you?" | "After finishing this project, who could actually run it — just you on your machine, another developer who reads your setup instructions, or people with no technical background using a deployed version?" |

**Why MUST:** Every current question was flagged during the CoVE validation as either inviting policy statements instead of behavioral evidence (Attributes 1, 2, 7), being too broad to differentiate tiers (Attributes 3, 5), or producing binary yes/no answers (Attribute 8). The design document's questions are specifically engineered to surface tier-differentiating evidence without revealing the scoring grid.

### 2.3 Implement Multi-Branch Trees (A/B/C) with Variable Depth

**Current:** Every attribute has exactly 2 follow-ups (depth and awareness). The binary `classifyResponse()` picks one. Total: always 2 questions per attribute.

**Target:** Each attribute has 2-4 questions depending on the user's tier signal. The branching is not binary — it is a tree with branches A, B, and sometimes C, plus tier confirmation probes and tier boundary probes. For example, Attribute 5 (Testing) has:

- Branch A (no tests) → follow-up about manual testing thoroughness → score Tier 1
- Branch B (automated tests exist) → follow-up about count and coverage → if integration tests, route to Tier 3 confirmation → if real data, route to Tier 3-4 probe → if out-of-sample, route to Tier 4 probe
- Branch C (integration + real data mentioned upfront) → skip directly to Tier 3-4 probe

This tree has up to 5 questions for a Tier 4 boundary case and 2 questions for a clean Tier 1 case.

**Why MUST:** The binary model cannot distinguish between Tier 2 and Tier 3 within the same branch. The design document's scoring logic requires confirmation probes at tier boundaries (e.g., "Did you document that tradeoff analysis anywhere — even briefly — or was it a decision you made mentally?"). Without these probes, the LLM evaluation must guess at boundary cases, which the design explicitly warns against.

### 2.4 Implement the Opening Sequence with Project Confirmation Echo-Back

**Current:** Two grounding questions asked in sequence, no confirmation, no echo-back.

**Target:** Four-part opening: (1) Welcome with ground rules and honesty framing, (2) Project selection prompt, (3) Bot echoes back a one-sentence summary of the project and confirms, (4) Transition to Attribute 1. The echo-back is critical because it anchors the entire conversation to a shared understanding of the project.

**Why MUST:** The design document states the echo-back is "the most important single design choice in the entire script" because every subsequent question references "that project." Without it, the LLM may drift in its understanding of what project is being discussed.

### 2.5 Implement Lower-Tier Discipline on All Boundary Calls

**Current:** The `classifyResponse()` function has a vague "default to awareness follow-up" rule, but the post-hoc LLM evaluation has no explicit boundary discipline.

**Target:** The system prompt must include the explicit instruction: "When a response contains signals for adjacent tiers (e.g., Tier 2 and Tier 3 simultaneously), always route to the lower tier's branch and ask the confirming follow-up. Apply lower-tier discipline on all boundary calls." This must be enforced in both the per-turn routing and the final scoring.

**Why MUST:** Without this rule, the LLM will tend to score generously on ambiguous responses, which inflates scores and undermines the rubric's core principle that "maturity is about reliable, repeatable behavior."

---

## 3. SHOULD Change — Materially Improves Accuracy or User Experience

These changes are strongly recommended. The app will function without them, but accuracy or UX will be noticeably degraded.

### 3.1 Add Transition Language Between Attributes

**Current:** The chat jumps directly from one attribute's follow-up to the next attribute's primary question with no bridge.

**Target:** Each attribute ends with a brief, neutral acknowledgment (1 sentence, non-evaluative — no "great answer") followed by a bridge sentence that connects to the next topic area. The design document provides specific transition text for each attribute boundary.

**Why SHOULD:** The design document explicitly warns against evaluative language ("great answer" affirmations invite users to repeat that pattern). Neutral transitions maintain conversational flow across a 15-25 minute session without biasing subsequent responses.

### 3.2 Add Anti-Gaming Framing to Follow-Up Questions

**Current:** Follow-up questions are generic ("Can you describe what was in that document?").

**Target:** Follow-ups are specifically designed to be hard to fake. Examples: "If I looked at your project folder right now" (forces description of what exists, not what was intended), "Was it something you wrote down, or more of a mental process?" (separates documented from undocumented), "Has anyone else actually run your code successfully?" (verifiable claim).

**Why SHOULD:** The design document includes a gaming risk assessment for each attribute. The current questions are vulnerable to a user who recognizes the rubric structure and answers aspirationally. The new questions make it significantly harder to perform a higher tier than actually practiced.

### 3.3 Implement Per-Attribute Scoring During Conversation (Internal)

**Current:** All scoring happens in a single post-hoc LLM call after the interview completes.

**Target:** The LLM assigns a provisional score for each attribute as it completes that attribute's branch. These scores are internal (never shown to the user during the interview) but are used to: (a) determine whether to ask additional tier-confirmation probes, and (b) provide the final score without requiring a second full-transcript evaluation.

**Why SHOULD:** Per-attribute scoring during the conversation means the LLM scores each attribute while the evidence is fresh in context, rather than re-reading the entire transcript at the end. This reduces scoring drift and improves consistency. However, the post-hoc evaluation approach still works — it is just less precise on boundary cases.

### 3.4 Implement the Structured Score Reveal Sequence

**Current:** The LLM generates a free-form narrative and the frontend renders it.

**Target:** The closing sequence follows a specific structure: (1) "That covers all eight areas. Let me put together your results." (2) Score table with all 8 attributes. (3) Tier-specific interpretation paragraph (the design document provides exact text for each tier). (4) Two highest-leverage growth priorities with specific actions. (5) Reassessment note about the 6-month cadence.

**Why SHOULD:** The structured reveal is more actionable than a free-form narrative. The tier-specific interpretation paragraphs are carefully written to give each tier exactly the right next step (Novice → start writing tests; Practitioner → write a design doc; Senior → publish an artifact; Principal → ship something others use).

### 3.5 Handle User Pushback and Abstract Answers

**Current:** No handling for users who answer in the abstract ("generally I do X").

**Target:** When the LLM detects abstract or general language, it redirects: "That's helpful context — can you point me to a specific moment from this project where that happened?" This is specified in the implementation notes.

**Why SHOULD:** Abstract answers are the primary source of score inflation. A user who says "I generally write tests" may not have written tests on the anchored project. The redirect forces specificity.

---

## 4. DISCRETIONARY — Polish, Optimization, or Future-Proofing

These changes improve the product but are not required for correctness or significant accuracy gains.

### 4.1 Add Scoring Confidence Metadata

The design document notes that Attributes 5 (Testing) and 8 (Production Orientation) produce the highest-confidence scores because they ask about artifacts that either exist or don't, while Attributes 1 (Problem Framing) and 7 (Domain Grounding) produce the lowest-confidence scores because they rely on user recall. Adding a confidence indicator to each attribute score would help users interpret their results more accurately.

### 4.2 Implement Session Dropout Mitigation

The design document warns that Attributes 1-3 are highest completion risk because users haven't yet invested in the experience. Keeping transitions brisk and not over-explaining the purpose of each question during the early attributes could improve completion rates. This could be implemented as a "concise mode" flag in the system prompt for the first 3 attributes.

### 4.3 Add "Ready to Begin?" Confirmation Gate

The design document specifies that after the welcome message, the bot waits for user confirmation before proceeding. If the user asks a clarifying question, the bot answers briefly and returns to the prompt. This is a small UX improvement that makes the opening feel less rushed.

### 4.4 Preserve the Self-Label Assessment as a "Quick Mode"

The original self-label assessment (the card-selection UI) could be preserved as a "Quick Assessment" option for users who want a rough estimate in 2 minutes rather than a 20-minute conversation. This would be clearly labeled as less accurate but useful for a first approximation.

### 4.5 Add Conversation Export

Allow users to download the full conversation transcript as a markdown file. This supports the rubric's emphasis on artifacts and documentation — the assessment conversation itself becomes a reflective artifact.

---

## 5. Build Sequence

The refactoring should be executed in the following order, with each step producing a testable, deployable state.

| Step | Description | Estimated Complexity | Dependencies |
|---|---|---|---|
| **Step 1** | Create the LLM conversation endpoint (`assessment.chat`) with the full chatbot script as system prompt. Include the complete branching logic, trigger signals, transition language, and scoring rules in the system prompt. Return structured metadata (current attribute, branch, provisional scores) alongside the bot message. | High | None |
| **Step 2** | Rewrite `ChatAssessment.tsx` to be a pure chat client. Remove all `interviewData.ts` imports. Replace the state machine with a simple message array + tRPC mutation call per user turn. Progress tracking reads from server metadata. | Medium | Step 1 |
| **Step 3** | Implement the structured score reveal. After the LLM completes all 8 attributes, generate the score table, tier interpretation, and growth priorities using the design document's exact templates. | Medium | Step 1 |
| **Step 4** | Update the save flow. The transcript is now the full LLM conversation (not a reconstructed Q&A). Ensure the save, share, and history endpoints accept the new format. | Low | Steps 1-3 |
| **Step 5** | Write vitest tests for the new chat endpoint: verify system prompt includes all 8 attributes, verify structured response format, verify boundary-case scoring discipline. | Medium | Step 1 |
| **Step 6** | Polish: add transition language, anti-gaming framing, pushback handling, and scoring confidence metadata. | Low | Steps 1-3 |

---

## 6. What Does NOT Change

The following components are downstream consumers of the evaluation output and require no modification, regardless of how the interview is conducted.

| Component | Why No Change |
|---|---|
| `drizzle/schema.ts` (assessments table) | The schema stores `transcript`, `scoresJson`, `growthPlanJson` — all of which are format-agnostic. The new conversation transcript is just a longer string. |
| `server/db.ts` (query helpers) | All helpers operate on the same schema. |
| `SharedResults.tsx` | Reads from `getByShareToken` — format-agnostic. |
| `History.tsx` | Reads from `history` — format-agnostic. |
| `CompareOverTime.tsx` | Reads `scoresJson` — same structure regardless of how scores were generated. |
| `MilestoneTracker.tsx` | Reads `growthPlanJson` — same structure. |
| `NotificationBell.tsx` | Reads from `notifications` table — no dependency on interview format. |
| `notifications.ts` (router) | No dependency on interview format. |
| Artifact verification (`verifyArtifact`) | Reads `transcript` and `scoresJson` — works with any transcript format. |
| Growth plan generation (`generateGrowthPlan`) | Reads evaluation output — same structured input regardless of interview method. |
| `Home.tsx` | Landing page — no dependency on interview internals. |
| `Results.tsx` / `GrowthPlan.tsx` | Static rubric views — no dependency on interview format. |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM drifts from the script and asks off-topic questions | Medium | High — produces unscored attributes | Include explicit instruction in system prompt: "You MUST ask about all 8 attributes in order. Do not skip any attribute. Do not ask questions outside the script." |
| LLM reveals scoring logic to the user mid-conversation | Low | High — enables gaming | Include explicit instruction: "NEVER mention tiers, scores, rubric structure, or scoring logic during the conversation. All scoring is internal and deferred to the end." |
| Latency per turn is too high (LLM call per message) | Medium | Medium — degrades UX | Use streaming responses. The system prompt is large (~4K tokens) but the conversation context grows slowly (user messages are short). Expect 2-4 second response times. |
| Token cost increases significantly | High | Low — cost is manageable | Current: 1 LLM call per assessment. New: ~20-30 LLM calls per assessment. However, each call is small (conversation context + short response). Total token usage approximately 3-4x current. |
| Conversation state lost on page refresh | Medium | Medium — user loses progress | Store conversation history in the database (new `conversationState` column on assessments table, or a separate `assessment_sessions` table). Restore on page load. |

---

## 8. Information Gaps

The following questions should be resolved before implementation begins.

1. **Streaming vs. batch responses:** Should the bot's messages stream token-by-token (better UX, more complex) or arrive as complete messages (simpler, slight delay)? The current `invokeLLM` helper does not support streaming — this would require extending the LLM integration.

2. **Conversation persistence:** Should in-progress conversations be saved to the database so users can resume after closing the browser? The current implementation loses all state on page refresh because it is client-side only.

3. **Rate limiting:** With ~25 LLM calls per assessment instead of 2, should there be a rate limit or authentication requirement to prevent abuse? Currently the `evaluate` and `generateGrowthPlan` endpoints are public procedures.

4. **Fallback behavior:** If the LLM fails mid-conversation (API timeout, rate limit), should the app retry, fall back to the deterministic state machine, or save progress and let the user resume later?

---

*Prepared for the Vibe Coder Self-Assessment project. This document should be reviewed and approved before implementation begins.*
