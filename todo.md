# Chat Assessment Upgrade

## Phase 1: Design
- [x] Design structured branching interview protocol (8 attributes × 3-4 questions each)
- [x] Design branching logic (follow-up questions based on initial answer)
- [x] Design LLM evaluation prompt that scores free-text against rubric
- [x] Design personalized growth plan generation prompt

## Phase 2: Full-stack upgrade + Chat UI
- [x] Upgrade to web-db-user for LLM backend
- [x] Build chat UI component replacing the card-selection assessment
- [x] Implement structured branching state machine for question flow
- [x] Build project grounding step (user describes a recent project)

## Phase 3: LLM evaluation + Growth plan
- [x] Build backend endpoint for LLM rubric evaluation
- [x] Build backend endpoint for personalized growth plan generation
- [x] Wire chat completion → LLM evaluation → results page
- [x] Generate growth plan with specific instructions based on user's gaps

## Phase 4: Test and polish
- [x] Test full flow end-to-end
- [x] Verify scoring accuracy against rubric (novice transcript → all Tier 1 scores)
- [x] Polish chat UX and transitions
- [x] Write vitest tests for branching logic and state machine
- [x] Update Home page CTAs for both assessment modes

## Feature 1: Database Persistence (Build First)
- [x] Add assessments table to drizzle schema (userId, compositeScore, compositeTier, narrative, scoresJson, growthPlanJson, transcript, shareToken, createdAt)
- [x] Run db:push migration
- [x] Add save endpoint in assessment router (protectedProcedure)
- [x] Add list/get endpoints for assessment history
- [x] Wire ChatAssessment to save results after LLM evaluation
- [x] Build assessment history page
- [x] Write vitest tests for persistence endpoints

## Feature 3: Shareable URL with OG Meta Tags (Build Second)
- [x] Add public route /share/:token that serves results
- [x] Generate unique share token per assessment
- [x] Add OG meta tags for social media preview (title, description, image placeholder)
- [x] Build public read-only results view
- [x] Add share button to results page that copies URL
- [x] Write vitest tests for share endpoints

## Feature 2: Artifact Verification (Build Third)
- [x] Add artifact upload UI to chat assessment (paste README/doc or upload file)
- [x] Store uploaded artifacts in S3
- [x] Extend LLM evaluation prompt to cross-reference transcript against artifacts
- [x] Add confidence adjustment based on artifact consistency
- [x] Show verification status on results page
- [x] Write vitest tests for artifact verification
