# Design Analysis: Round 2 Features

## Feature 1: Compare Over Time

### Option A: Overlay Radar Charts
Display multiple assessment radar charts overlaid on the same canvas with different colors per date. Users toggle which assessments to compare.
- **Pros:** Visually striking, immediate pattern recognition, shows shape changes across all 8 attributes at once
- **Cons:** Gets cluttered with 3+ assessments, radar charts distort perception of absolute values, requires recharts radar component

### Option B: Small Multiples Timeline
One row per attribute, each showing a sparkline of that attribute's score over time. 8 rows, each with a mini line chart. Assessment dates on x-axis.
- **Pros:** Accurate perception of change per attribute, scales to many assessments, no visual distortion, easy to spot which attributes improved/regressed
- **Cons:** Less visually dramatic, requires more vertical space, harder to see cross-attribute patterns at a glance

### Option C: Delta Table with Trend Arrows
A table showing the two most recent assessments side-by-side with delta arrows (↑ ↓ →) and color coding. No charts at all.
- **Pros:** Simplest to build, most precise, works on mobile, no chart library needed
- **Cons:** Only compares 2 assessments, no historical trend, less engaging, doesn't leverage the visual design language

### Decision: **Option B — Small Multiples Timeline**
Reasoning: The primary use case is tracking growth over a 6-month cadence. Users will accumulate 2-6 assessments over time. Small multiples scale cleanly to that range without distortion. Each attribute gets its own clear trendline, making it easy to answer "which attributes am I actually improving on?" — which is the core question. Radar overlays look good in demos but become unreadable with 3+ layers and distort perception. The delta table is too reductive for a tool about nuanced growth.

---

## Feature 2: Email/Notification on Completion

### Option A: Built-in Owner Notification (notifyOwner)
Use the existing `notifyOwner` helper to send a notification to the app owner when any user completes an assessment. The owner sees a summary with tier, score, and gaps.
- **Pros:** Zero new infrastructure, already wired, works immediately
- **Cons:** Only notifies the OWNER, not the user who took the assessment. Wrong audience for this feature.

### Option B: In-App Notification Center
Build a notifications table in the DB. After assessment completion, create a notification record. Show a bell icon in the header with unread count. Notification contains summary + link to results.
- **Pros:** No external dependencies, works for all users, persistent record, can add more notification types later (e.g., "time to reassess"), integrates with the existing auth system
- **Cons:** Users must return to the app to see notifications, no push/email delivery

### Option C: Downloadable PDF Summary
After assessment, generate a structured markdown summary and offer it as a downloadable file. Contains tier, scores, evidence, growth plan, and share link.
- **Pros:** User gets a tangible artifact they own, works offline, can be emailed/shared manually, no notification infrastructure needed, serves as a "receipt" of the assessment
- **Cons:** Not a real notification, requires user action to download, no reminder capability

### Decision: **Option B + C Hybrid — In-App Notification Center + Downloadable Summary**
Reasoning: Option A is wrong (notifies owner, not user). Pure Option C isn't a notification — it's an export. Option B gives us a real notification system that can grow (reassessment reminders, growth plan milestones). But the downloadable summary from Option C is independently valuable — it gives users an artifact outside the app. The build cost of combining B+C is marginal since the notification center is a small DB table + UI component, and the summary is a markdown template rendered to a download link. I'll build the notification center as the primary feature and add a "Download Summary" button to the results page.

---

## Feature 3: Growth Plan Progress Tracking

### Option A: Inline Checkboxes per Deliverable
Add checkboxes directly to each deliverable in the growth plan view. Store checked state in a JSON column on the assessment record. Show a progress bar per phase.
- **Pros:** Minimal UI change, familiar checkbox pattern, progress bar gives satisfaction feedback
- **Cons:** Deliverables are LLM-generated strings — they're not granular tasks. Checking "Write a design doc" doesn't mean much without sub-steps. Flat list doesn't capture the sequential nature of the work.

### Option B: Kanban Board per Phase
Three columns per phase: Not Started, In Progress, Done. Each deliverable is a card that can be dragged between columns. Phase progress derived from card positions.
- **Pros:** Visual, interactive, familiar from project management tools
- **Cons:** Massive UI complexity for 3-6 items per phase, overkill for this use case, drag-and-drop is fragile on mobile, doesn't match the linear nature of a growth plan

### Option C: Phase-Gated Milestone Tracker
Each phase has a set of milestones (derived from deliverables + success criteria). User marks milestones complete. When all milestones in a phase are done, the phase "unlocks" visually and the next phase activates. Overall progress shown as a 3-segment progress bar. Completion triggers a notification + option to reassess.
- **Pros:** Gamification without being gimmicky, enforces sequential progression, completion triggers reassessment loop, ties directly into the notification system, success criteria become verification checkpoints
- **Cons:** More complex than simple checkboxes, requires DB schema for milestone state

### Decision: **Option C — Phase-Gated Milestone Tracker**
Reasoning: The growth plan is inherently sequential — 0-30 before 30-60 before 60-90. A flat checkbox list ignores this structure. The phase-gated approach reinforces the rubric's emphasis on reliable, repeatable behavior by requiring completion before advancement. It also creates a natural loop: complete all 3 phases → get notified → reassess → new plan. This ties directly into the notification center (Feature 2) and the compare-over-time view (Feature 1), creating a cohesive growth cycle. Kanban is overkill and wrong metaphor.

---

## Build Sequence

**Optimal order: 2 → 3 → 1**

1. **Feature 2 (Notifications + Download)** — builds the notification infrastructure (DB table, bell icon, notification list). This is a prerequisite for Feature 3 (milestone completion triggers notifications) and creates the "reassess" prompt that feeds Feature 1.

2. **Feature 3 (Milestone Tracker)** — depends on notification system from Feature 2 to fire "phase complete" and "plan complete → reassess" notifications. Adds milestone state to DB. The completion-triggers-reassessment loop is the core growth cycle.

3. **Feature 1 (Compare Over Time)** — depends on users having multiple assessments, which the reassessment loop from Features 2+3 encourages. The small multiples view reads from the existing assessment history. Pure frontend + existing data.
