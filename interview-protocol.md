# Structured Branching Interview Protocol

## Architecture

The interview is a deterministic state machine with three stages:

1. **Project Grounding** — anchor the conversation in a real, recent project
2. **Attribute Probing** — 8 rounds of behavioral questions, one per attribute
3. **Completion** — all answers collected, sent to LLM for rubric evaluation

Each attribute round has a primary question (always asked) and 1-2 follow-up questions that branch based on the answer type. Follow-ups probe for depth and specificity.

## Stage 1: Project Grounding

Q1: "Tell me about a project you completed in the last 30-60 days. What were you building and what problem were you trying to solve?"

Q2: "Was this a solo project or collaborative? How long did it take from start to deployment (or current state)?"

These answers become context for all subsequent questions.

## Stage 2: Attribute Probing

### Attribute 1: Problem Framing

PRIMARY: "Before you started building [project name], did you write anything down about the problem you were solving? If so, what did that look like?"

FOLLOW-UP A (if they mention a doc/README/notes): "Can you describe what was in that document? Did it include goals, non-goals, or success criteria?"

FOLLOW-UP B (if they say no or vague): "How did you decide what to build first? What guided your initial prompts to the AI?"

### Attribute 2: Architecture Selection

PRIMARY: "What tech stack or architecture did you use for this project? How did you arrive at that choice?"

FOLLOW-UP A (if they mention evaluating options): "What alternatives did you consider? What made you pick this one over the others?"

FOLLOW-UP B (if they say AI suggested it / default): "If you were starting over, would you choose the same stack? What would you change and why?"

### Attribute 3: Scope Discipline

PRIMARY: "Did the project end up being what you originally planned, or did it change along the way? How?"

FOLLOW-UP A (if scope changed): "At what point did you realize the scope was shifting? Did you document what was in-scope vs. out-of-scope?"

FOLLOW-UP B (if scope stayed stable): "How did you decide what NOT to build? Were there features you deliberately excluded?"

### Attribute 4: Iteration Methodology

PRIMARY: "When something wasn't working during development, how did you figure out what was wrong and fix it?"

FOLLOW-UP A (if they describe a process): "Can you walk me through a specific bug or issue? What was the symptom, what was the root cause, and how did you find it?"

FOLLOW-UP B (if they say trial-and-error / re-prompted): "How many times did you typically re-prompt the AI before something worked? Did you change your approach or just retry?"

### Attribute 5: Testing & Validation

PRIMARY: "Does this project have tests? Tell me about your testing approach."

FOLLOW-UP A (if tests exist): "What kinds of things do your tests cover? Are there edge cases or error scenarios included?"

FOLLOW-UP B (if no tests): "How do you know the project works correctly? What did you do to verify it?"

### Attribute 6: Documentation & Artifacts

PRIMARY: "If I cloned your project right now, what documentation would I find? Could I get it running without asking you questions?"

FOLLOW-UP A (if docs exist): "Who is the documentation written for? Is it just setup instructions, or does it explain the why behind decisions?"

FOLLOW-UP B (if minimal/no docs): "If you had to hand this project to someone else tomorrow, what would they struggle with?"

### Attribute 7: Domain Grounding

PRIMARY: "How much did you know about the problem domain before starting? Did you do any research into how this problem is typically solved?"

FOLLOW-UP A (if they researched): "What sources did you look at? Did any domain knowledge change how you designed the solution?"

FOLLOW-UP B (if no research): "Were there any domain-specific conventions or standards that applied to your project? How did you handle them?"

### Attribute 8: Production Orientation

PRIMARY: "Is this project deployed and usable by someone other than you? What would need to happen to make it production-ready?"

FOLLOW-UP A (if deployed): "What happens if something breaks in production? Do you have error handling, monitoring, or a way to know?"

FOLLOW-UP B (if not deployed): "What's stopping you from deploying it? What would you need to add?"

## Branching Logic

Each primary question is always asked. The follow-up selection is based on keyword/intent detection in the user's response:

- If response contains evidence of artifacts, process, or structure → FOLLOW-UP A (probes for depth)
- If response is vague, negative, or indicates default behavior → FOLLOW-UP B (probes for awareness)

This branching is deterministic: the chat engine classifies the response into one of two buckets and selects the corresponding follow-up. No LLM needed for branching — simple keyword matching or a lightweight classifier suffices.

## Stage 3: LLM Evaluation

After all 8 attribute rounds are complete, the full transcript is sent to the LLM with the rubric as a scoring guide. The LLM returns:

1. A tier score (1-4) for each attribute with evidence citations from the transcript
2. A composite tier with narrative explanation
3. A personalized growth plan that references the user's specific project and gaps
