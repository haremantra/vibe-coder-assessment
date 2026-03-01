# Feature Design Analysis: Three Options per Feature

## Feature 1: Save Assessment Results to Database

### Option A: Flat Results Table
Store the composite score, tier, and narrative as a single row per assessment. Attribute scores stored as a JSON column. Simple, fast reads.

**Pros:** Minimal schema changes, fast queries, easy to display history.
**Cons:** JSON column makes per-attribute querying harder, no relational integrity on scores.

### Option B: Normalized Schema (assessments + attribute_scores tables)
Parent `assessments` table with child `attribute_scores` table. Full relational model with foreign keys.

**Pros:** Clean relational queries, can aggregate per-attribute trends over time, proper indexing.
**Cons:** More complex joins, two migrations, more code for CRUD.

### Option C: Document Store Approach
Store the entire evaluation and growth plan as a single large JSON blob in one column.

**Pros:** Simplest write path — just serialize and store.
**Cons:** No queryability, can't build trend analysis, can't compare attributes across assessments, treats the DB as a file system.

### Decision: Option A (Flat Results Table with JSON scores)
Option B is over-engineered for a self-assessment tool where the primary read pattern is "show me my past results." Users are not running SQL analytics across their attribute scores. Option C is too unstructured — we lose the ability to show score trends. Option A hits the sweet spot: the composite score and tier are first-class columns (sortable, filterable), while the per-attribute detail lives in a JSON column that we only need to deserialize on the detail view. This also means a single `INSERT` per assessment, which keeps the write path clean during the LLM evaluation flow.

---

## Feature 2: Artifact Verification (Repo/README Upload)

### Option A: Full Repo Analysis via GitHub API
User pastes a GitHub URL. Backend clones or fetches the repo tree via GitHub API, analyzes file structure, counts tests, checks for docs, and cross-references claims.

**Pros:** Most rigorous verification, can check actual test counts, file structure, README quality.
**Cons:** Requires GitHub API auth or rate limiting, large repos are slow, private repos need OAuth scoping, significant backend complexity.

### Option B: README/Doc Upload + LLM Cross-Reference
User uploads or pastes their README, design doc, or any project artifact as text. The LLM receives both the interview transcript AND the artifact, then cross-references claims against the document.

**Pros:** Works with any project (not just GitHub), no API dependencies, the LLM is already in the pipeline so this is an additive prompt, handles private projects, fast to implement.
**Cons:** Relies on user honesty about what they upload, can't verify test counts or file structure directly.

### Option C: Screenshot/Image Upload of Project
User uploads screenshots of their project, terminal output, or deployment dashboard. LLM analyzes images alongside transcript.

**Pros:** Visual evidence is hard to fake, shows actual deployment state.
**Cons:** Image analysis is slower and less reliable for structured evaluation, screenshots can be cherry-picked, harder to extract structured data.

### Decision: Option B (README/Doc Upload + LLM Cross-Reference)
Option A is the most rigorous but introduces a hard dependency on GitHub (not all vibe coders use GitHub — many deploy directly from Cursor/Replit/Vercel). Option C is creative but unreliable for structured scoring. Option B is optimal because it extends the existing LLM pipeline with minimal new infrastructure: the user pastes or uploads text artifacts, and we add them to the evaluation prompt. The LLM can then flag discrepancies ("User claimed they wrote tests, but the README mentions no testing section") and adjust confidence. This also works for any project regardless of hosting. We use S3 for file upload storage.

---

## Feature 3: Share Results Card

### Option A: Server-Side Image Generation (Canvas/Sharp)
Generate a PNG card on the server using node-canvas or sharp with SVG overlay. Return a downloadable image URL.

**Pros:** Pixel-perfect output, works everywhere, shareable on any platform.
**Cons:** Requires native dependencies (canvas/sharp), complex layout code in SVG/canvas, server resource intensive.

### Option B: Client-Side HTML-to-Canvas (html2canvas)
Render a styled HTML div on the client, capture it with html2canvas, and let the user download or share the resulting image.

**Pros:** Uses existing React components and CSS, no server cost, WYSIWYG — what they see is what they share.
**Cons:** html2canvas has rendering quirks (fonts, gradients, shadows), cross-browser inconsistencies, large client-side library.

### Option C: Shareable URL with OG Meta Tags
Generate a unique URL per assessment result. The page has proper Open Graph meta tags so when shared on social media, it renders a rich preview card. The page itself is a public read-only view of the results.

**Pros:** Native social media integration, no image generation needed, the shared link IS the content, recipients can see the full results.
**Cons:** Requires public routes, OG tags need server-side rendering, the user must be comfortable with their results being publicly accessible.

### Decision: Option C (Shareable URL with OG Meta Tags)
Option A requires native dependencies that complicate deployment. Option B produces inconsistent results across browsers and the html2canvas library is 400KB+. Option C is the most natural sharing mechanism: the user gets a unique URL they can share anywhere, and social platforms automatically render a rich preview card. Since we already have a database (Feature 1), we store results and serve them on a public route. We add a simple share token (not the user ID) for privacy, and the OG meta tags pull from the stored assessment data. This also means the recipient can click through and see the full results, not just a static image — which is more useful for mentors reviewing someone's assessment.

---

## Build Sequence

The optimal build order is: **1 → 3 → 2**

**Rationale:** Feature 1 (database persistence) is a prerequisite for Feature 3 (shareable URLs need stored results to serve). Feature 2 (artifact verification) is independent and additive — it enhances the evaluation pipeline but doesn't block sharing or persistence. Building 1 first establishes the data layer, then 3 builds the public sharing on top of that data, and finally 2 adds the artifact cross-referencing to the evaluation step.
