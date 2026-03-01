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
