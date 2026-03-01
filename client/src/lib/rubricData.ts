/*
 * Signal / Noise — Vibe Coder Assessment Data
 * Complete rubric data, tier definitions, and 30-60-90 day growth plans
 */

export interface TierDescription {
  tier: number;
  label: string;
  title: string;
  bullets: string[];
  evidenceSignals: string[];
}

export interface Attribute {
  id: number;
  name: string;
  description: string;
  tiers: TierDescription[];
}

export interface TierMeta {
  tier: number;
  label: string;
  coreSignal: string;
  equivalent: string;
  scoreRange: string;
  percentile: string;
  profile: string;
  growthEdge: string;
}

export interface Project {
  title: string;
  description: string;
  deliverables: string[];
  skills: string[];
}

export interface PhaseContent {
  phase: string;
  label: string;
  focus: string;
  projects: Project[];
}

export interface GrowthPlanData {
  tier: string;
  primaryFocus: string;
  phases: PhaseContent[];
}

export const TIER_META: TierMeta[] = [
  {
    tier: 1,
    label: "Novice",
    coreSignal: "Prompt → paste → ship",
    equivalent: "0-3 years traditional coding equivalent",
    scoreRange: "8-13",
    percentile: "Bottom 50%",
    profile: "You successfully generate working code with AI assistance but rely heavily on the AI's judgment. Focus on learning to review and iterate on generated code.",
    growthEdge: "Start writing tests and reviewing AI output critically.",
  },
  {
    tier: 2,
    label: "Practitioner",
    coreSignal: "Prompt → review → iterate",
    equivalent: "3-10 years equivalent",
    scoreRange: "14-19",
    percentile: "50th-75th",
    profile: "You review, iterate, and test generated code. You understand what you're building and can explain it.",
    growthEdge: "Transition from iteration to architecture — think before you prompt.",
  },
  {
    tier: 3,
    label: "Senior",
    coreSignal: "Architect first, then prompt",
    equivalent: "10+ years equivalent",
    scoreRange: "20-25",
    percentile: "75th-90th",
    profile: "You architect first, then prompt. You make reasoned technical decisions and document them. You build systems, not just scripts.",
    growthEdge: "Contribute back to the field — write, teach, or publish.",
  },
  {
    tier: 4,
    label: "Principal",
    coreSignal: "Shapes the paradigm",
    equivalent: "Research/founding engineer equivalent",
    scoreRange: "26-32",
    percentile: "Top 10%",
    profile: "You shape paradigms, ground decisions in research, and build for impact beyond yourself. You're operating at a founding engineer or research level.",
    growthEdge: "Ship and scale. Turn architectures into production systems and products.",
  },
];

export const ATTRIBUTES: Attribute[] = [
  {
    id: 1,
    name: "Problem Framing",
    description: "How you define and structure problems before generating solutions.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Reactive Acceptance",
        bullets: [
          "You start building immediately based on the problem statement as given",
          "The AI's interpretation of your prompt becomes your understanding of the problem",
          "You don't question whether the problem framing is correct",
          "You discover what you're actually building midway through the session",
        ],
        evidenceSignals: [
          '"I asked for X and built X, but realized I needed Y"',
          "Project scope changes multiple times during a session",
          "No written problem statement exists before the first code generation",
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Clarification Focus",
        bullets: [
          "You refine your prompts to better describe the problem before building",
          "You ask clarifying questions of yourself or the AI to understand edge cases",
          "You document a brief problem statement or user story before coding",
          "You can articulate what success looks like before generating solutions",
        ],
        evidenceSignals: [
          'A README or doc has a "Problem" or "Goals" section written first',
          "You iterate on problem description, not just on code",
          "You can explain why you're building something in 2-3 sentences",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Decomposition and Constraints",
        bullets: [
          "You break complex problems into smaller subproblems before prompting",
          "You identify and document constraints (technical, resource, time) upfront",
          'You distinguish between "what must work" and "what would be nice"',
          "You evaluate whether the stated problem is the right problem to solve",
        ],
        evidenceSignals: [
          "Written decomposition of problem into 3-5 subproblems",
          "Explicit constraint documentation (performance, cost, compatibility)",
          "Non-goals or out-of-scope section exists",
          "You can articulate why you chose not to solve related problems",
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "Frame Challenging and Methodology",
        bullets: [
          "You challenge the problem framing itself before accepting it",
          "You evaluate whether a different problem statement would be more valuable",
          "You ground problem definitions in data or domain evidence, not assumptions",
          "You select methodologies based on problem structure",
        ],
        evidenceSignals: [
          "Documented analysis of why this problem framing over alternatives",
          "Evidence gathering (user research, corpus analysis, literature review) before design",
          "Explicit methodology selection with rationale",
          "You've rejected or reframed a problem statement based on evidence",
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Architecture Selection",
    description: "How you choose technical stacks, patterns, and architectural approaches.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Default Acceptance",
        bullets: [
          "You use the first architecture or stack the AI suggests",
          "You don't evaluate alternatives before starting",
          "Technology choices are driven by familiarity or momentum",
          "You can't articulate why you chose this approach over others",
        ],
        evidenceSignals: [
          '"I used X because that\'s what the AI gave me"',
          "No comparison of alternatives in documentation",
          "Architecture matches the AI's default suggestion without modification",
          "You discover architectural limitations only when they cause problems",
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Comparison Awareness",
        bullets: [
          "You ask for or research 2-3 alternative approaches before choosing",
          "You select based on familiarity balanced with requirements",
          "You can name one advantage of your chosen approach",
          "You iterate on architecture when the first choice doesn't fit",
        ],
        evidenceSignals: [
          'Prompt history shows you asked "what are alternatives to X?"',
          "README mentions why you chose this stack",
          "You've switched architectures once during development when needed",
          "You can explain one tradeoff you made",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Tradeoff Evaluation",
        bullets: [
          "You explicitly evaluate tradeoffs across multiple dimensions (cost, scale, maintainability, explainability)",
          "You select non-default architectures when specific properties are needed",
          "You document why you chose this approach and what you gave up",
          "Your architectural choices are defensible to a technical audience",
        ],
        evidenceSignals: [
          "Written architecture decision with 2+ alternatives considered",
          'Documented tradeoffs (e.g., "chose X for Y property, sacrificed Z")',
          "You've selected an unconventional approach with a clear rationale",
          "Your architecture addresses a specific non-functional requirement",
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "First-Principles and Hybrid Design",
        bullets: [
          "You design architectures from first principles based on constraints",
          "You create hybrid approaches combining paradigms (rule-based + ML, sync + async)",
          "Your architectural choices create defensible competitive advantages",
          "You can articulate how your architecture is different from market defaults and why",
        ],
        evidenceSignals: [
          "Novel or hybrid architecture not commonly seen in the domain",
          "Architecture explicitly designed for a specific property (determinism, auditability, zero-cost scaling)",
          "Documented competitive differentiation from standard approaches",
          "You've rejected industry-standard patterns based on first-principles analysis",
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Scope Discipline",
    description: "How you manage and control what gets built versus what doesn't.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Unbounded Expansion",
        bullets: [
          "You add features until you run out of time or something breaks",
          "Scope expands continuously during development",
          "You can't clearly state what's in scope vs. out of scope",
          '"Done" is determined by exhaustion, not by criteria',
        ],
        evidenceSignals: [
          "Project keeps growing without clear stopping point",
          "No documented feature boundary",
          "You built features you didn't originally intend",
          '"I just kept going until it felt like enough"',
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Upfront Boundary Setting",
        bullets: [
          "You define target scope before building",
          "You have a feature list or requirements document",
          "Scope drifts somewhat during development but you recognize it",
          "You can state what you intended to build vs. what you built",
        ],
        evidenceSignals: [
          "Initial feature list or MVP definition exists",
          "You noticed when scope expanded beyond the original plan",
          'README has a "Features" section written before completion',
          "You completed most but not all of your intended features",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Documented Boundaries with Rationale",
        bullets: [
          "You document formal scope boundaries with justification",
          "You distinguish must-have from nice-to-have features",
          "You make explicit decisions about what not to build",
          "You can defend scope choices with reasoning (time, complexity, value)",
        ],
        evidenceSignals: [
          "Written scope statement with in-scope / out-of-scope sections",
          "Documented reasons for excluding certain features",
          "Prioritized feature list with tier labels (P0, P1, P2)",
          'You\'ve said "no" to feature additions during development',
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "Empirical Stopping Decisions",
        bullets: [
          "You make stopping decisions based on data or evidence",
          "You document diminishing returns or saturation rationales",
          "You defend scope limits with empirical justification",
          "You resist scope creep even under pressure, with documented reasoning",
        ],
        evidenceSignals: [
          'Documented analysis of why to stop (e.g., "corpus saturation at N items")',
          "Quantified diminishing returns analysis",
          "You've explicitly chosen not to continue expansion despite capability",
          "Stopping decisions include empirical measurements or thresholds",
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Iteration Methodology",
    description: "How you identify, analyze, and fix problems during development.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Symptom Chasing",
        bullets: [
          "You re-prompt the AI when something breaks without understanding why",
          "You apply fixes without identifying root causes",
          "Error messages are treated as problems to make go away",
          "You repeat the same mistakes because you don't analyze patterns",
        ],
        evidenceSignals: [
          "Multiple attempts at the same fix with minor prompt variations",
          '"I tried changing X until it worked"',
          "No documentation of what was wrong or why the fix worked",
          "Same bug reappears in different contexts",
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Symptom Identification",
        bullets: [
          "You clearly describe symptoms and error patterns",
          "You communicate problems precisely to the AI for diagnosis",
          "You verify that fixes actually resolve the issue",
          "You document what was broken and what fixed it",
        ],
        evidenceSignals: [
          "Clear bug descriptions in prompts or documentation",
          "You test that fixes work before moving on",
          "Commit messages or logs describe what was fixed",
          "You can explain what was broken after fixing it",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Root Cause Analysis",
        bullets: [
          "You trace bugs to root causes before attempting fixes",
          "You analyze why the problem occurred, not just what failed",
          "You evaluate multiple fix options before implementing",
          "You prioritize fixes by impact and feasibility",
        ],
        evidenceSignals: [
          "Documented root cause for at least one major issue",
          'Written analysis of "why this happened" not just "what happened"',
          "Evidence of comparing fix options (fix A vs. fix B tradeoffs)",
          "Prioritized fix list with reasoning",
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "Structured Improvement Cycles",
        bullets: [
          "You design formal improvement cycles with numbered work items",
          "You run options analysis per issue (3+ alternatives with tradeoffs)",
          "You measure impact before and after each fix",
          "You treat iteration as a methodology, not a reaction to failure",
        ],
        evidenceSignals: [
          "Numbered work items with status tracking (P1, P2, P3, etc.)",
          "Written options analysis with benefits/costs per issue",
          "Metrics tracked before/after improvement cycle",
          "Improvement cycle is documented as a phase of the project",
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Testing & Validation",
    description: "How you verify that your system works correctly.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Manual Verification Only",
        bullets: [
          "You click through the application manually to check if it works",
          "No automated tests exist",
          'Validation is limited to "it didn\'t crash"',
          "You test only the happy path",
        ],
        evidenceSignals: [
          "Zero test files in the repository",
          "Verification consists of running the app once",
          "You discover bugs in production or during demos",
          '"It worked when I tried it"',
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Basic Automated Testing",
        bullets: [
          "You write unit tests for core functions",
          "Tests cover the happy path for primary features",
          "You run tests manually before considering work complete",
          "Test count is 10-30 tests",
        ],
        evidenceSignals: [
          "Test files exist with 10+ tests",
          "Tests verify primary functionality",
          'README mentions "run tests" as a step',
          "Most tests pass most of the time",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Integration and Real-Data Testing",
        bullets: [
          "You write integration tests that test multi-module interactions",
          "You use real data fixtures, not just synthetic examples",
          "You distinguish between in-sample and out-of-sample validation",
          "You test error cases and edge conditions, not just happy paths",
        ],
        evidenceSignals: [
          "Test suite includes integration tests",
          "Tests use real or realistic data fixtures",
          "Validation includes data not used during development",
          "Error handling and edge cases have explicit tests",
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "Experimental Evaluation Design",
        bullets: [
          "You design formal validation rubrics with multiple metrics",
          "You track metric changes across build phases",
          "You document known failure modes with reproducibility conditions",
          "You understand statistical properties of your validation results",
        ],
        evidenceSignals: [
          "Validation metrics tracked over time (baseline → improved)",
          "Documented test sets with clear in-sample / out-of-sample splits",
          "Known failure modes documented with reproduction steps",
          "Validation reports include confidence intervals or statistical analysis",
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Documentation & Artifacts",
    description: "What you leave behind for others (or future you) to understand your work.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Code Only",
        bullets: [
          "No documentation beyond the code itself",
          "README is empty or generic",
          "You rely on memory to reconstruct context",
          "Future you will struggle to understand what past you built",
        ],
        evidenceSignals: [
          "No README or a template README with no customization",
          "No inline comments explaining non-obvious choices",
          "Project structure requires code reading to understand",
          "You've forgotten how your own old projects work",
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Basic Documentation",
        bullets: [
          "README with setup instructions and basic usage",
          "Some inline comments on complex sections",
          "High-level description of what the project does",
          "Future you can probably figure out how to run it",
        ],
        evidenceSignals: [
          "README covers installation and basic usage",
          "Key functions have docstrings or comments",
          "Project purpose is stated in one place",
          "Documentation takes 30-60 minutes to write",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Architecture and Handoff Documentation",
        bullets: [
          "Architecture diagrams or design documents",
          "API references or interface contracts",
          "Design rationale documented (why, not just what)",
          "Another developer can understand and extend the system",
        ],
        evidenceSignals: [
          "Multiple documentation files (README + design doc + API reference)",
          "Architecture diagram or module relationship explanation",
          "Design decisions documented with reasoning",
          "Documentation is treated as a deliverable, not an afterthought",
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "Audience-Differentiated Artifacts",
        bullets: [
          "Multiple documentation layers for different audiences (technical, business, operations)",
          "Documentation includes both how-to and why-this-way",
          "Artifacts are production-ready for handoff",
          "Documentation architecture parallels code architecture",
        ],
        evidenceSignals: [
          "3+ distinct documents for different audiences",
          "Investor/pitch deck alongside technical spec",
          "Deployment guides, API references, and design briefs all present",
          "Documentation often longer than code",
        ],
      },
    ],
  },
  {
    id: 7,
    name: "Domain Grounding",
    description: "How much domain expertise and prior art informs your technical decisions.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Domain-Agnostic Approach",
        bullets: [
          "You treat all problems as generic software problems",
          "No domain-specific constraints are considered",
          "You don't research how others have solved similar problems",
          "Domain expertise is not visible in design choices",
        ],
        evidenceSignals: [
          "Generic technology choices regardless of domain",
          "No mention of domain standards or practices",
          "You build in isolation from domain conventions",
          "Domain experts would not recognize their field in your work",
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Basic Domain Awareness",
        bullets: [
          "You incorporate obvious domain terminology into prompts",
          "You know basic constraints from the domain",
          "You reference one or two domain resources",
          "You can communicate with domain experts at a basic level",
        ],
        evidenceSignals: [
          "Domain-specific terms used correctly in documentation",
          "Awareness of basic domain constraints (regulatory, workflow, standard formats)",
          "One or two domain references cited",
          "Domain practitioners could use your system with minimal confusion",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Standards and Prior Art Integration",
        bullets: [
          "You research domain standards and conventions before building",
          "Your design references industry taxonomies or frameworks",
          "You can position your work relative to prior art",
          "You ground technical choices in domain requirements",
        ],
        evidenceSignals: [
          "Citations to domain standards (ISO, regulatory frameworks, industry taxonomies)",
          "Documented comparison to existing solutions in the domain",
          "Architecture choices reference domain-specific properties",
          "You've adopted or rejected domain conventions with reasoning",
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "Literature Review and Novel Contribution",
        bullets: [
          "You conduct systematic literature review before building",
          "You synthesize academic and industry sources",
          "You identify gaps in prior art that your work addresses",
          "Your contribution to the domain is clearly articulated",
        ],
        evidenceSignals: [
          "Formal literature review with 10+ sources",
          "Documented novel contributions not present in existing work",
          "Academic or industry papers cited with synthesis",
          "You can explain how your approach differs from all prior work",
        ],
      },
    ],
  },
  {
    id: 8,
    name: "Production Orientation",
    description: "How ready your system is for use beyond your development environment.",
    tiers: [
      {
        tier: 1,
        label: "Novice",
        title: "Session-Only Functionality",
        bullets: [
          "System works during the development session only",
          "No path to deployment is considered",
          "No thought given to how others would run this",
          '"It works on my machine" is the only guarantee',
        ],
        evidenceSignals: [
          "Hardcoded file paths or environment assumptions",
          "No installation instructions",
          "Dependencies not documented",
          "System likely won't run on another machine",
        ],
      },
      {
        tier: 2,
        label: "Practitioner",
        title: "Basic Portability",
        bullets: [
          "System runs on another developer's machine with setup instructions",
          "Dependencies are documented (requirements.txt, package.json)",
          "Basic packaging exists (pip install, npm install)",
          "Installation takes 10-30 minutes following instructions",
        ],
        evidenceSignals: [
          "Requirements or dependency file exists",
          "README has installation section",
          "Another person has successfully run your code",
          "Basic packaging script (setup.py, package.json) present",
        ],
      },
      {
        tier: 3,
        label: "Senior",
        title: "Production-Ready Tooling",
        bullets: [
          "CLI interface or API endpoints defined",
          "Schema validation and error handling for production use",
          "Dependency management and version pinning",
          "Named integration points for downstream systems",
        ],
        evidenceSignals: [
          "CLI tool with subcommands or REST API with documented endpoints",
          "Error handling for invalid inputs",
          "Semantic versioning or release process",
          "Integration guide for embedding in other systems",
        ],
      },
      {
        tier: 4,
        label: "Principal",
        title: "Deployment and Monetization Planning",
        bullets: [
          "Deployment topology documented (container, service architecture)",
          "Monetization or business model paths analyzed",
          "Architecture designed for specific production properties (scale, cost, SLA)",
          "Handoff materials prepared for production engineering team",
        ],
        evidenceSignals: [
          "Dockerfile or deployment configuration",
          "Documented integration paths with specific systems (databases, services)",
          "Monetization analysis or business model documentation",
          "Architecture explicitly designed for production constraints",
        ],
      },
    ],
  },
];

export function getTierFromScore(totalScore: number): TierMeta {
  if (totalScore <= 13) return TIER_META[0];
  if (totalScore <= 19) return TIER_META[1];
  if (totalScore <= 25) return TIER_META[2];
  return TIER_META[3];
}

export const GROWTH_PLANS: Record<string, GrowthPlanData> = {
  Novice: {
    tier: "Novice",
    primaryFocus: 'Move from "prompt and paste" to "prompt, review, and test." Build the habit of questioning AI output before shipping it.',
    phases: [
      {
        phase: "0-30",
        label: "Foundation: Learn to Question",
        focus: "Develop the habit of reviewing AI output and writing basic tests. Every project should have a README written before the first line of code.",
        projects: [
          {
            title: "Personal Portfolio with Test Suite",
            description: "Build a personal portfolio site using AI-assisted coding, but write the problem statement and feature list BEFORE prompting. Add 10+ unit tests using Vitest or Jest.",
            deliverables: [
              "Written problem statement (1 paragraph) before any code",
              "Feature list with 5-8 items, written before building",
              "Deployed portfolio with at least 3 sections",
              "Test file with 10+ passing tests",
              "README with setup instructions",
            ],
            skills: ["Problem Framing", "Testing & Validation", "Documentation & Artifacts"],
          },
          {
            title: "AI Output Review Journal",
            description: "For every AI coding session this month, keep a log: what you prompted, what the AI gave you, what you changed, and why. Review weekly for patterns.",
            deliverables: [
              "Markdown journal with 15+ entries",
              "Weekly summary of patterns noticed",
              "List of 3 common AI mistakes you've identified",
            ],
            skills: ["Iteration Methodology", "Problem Framing"],
          },
        ],
      },
      {
        phase: "30-60",
        label: "Structure: Build with Intent",
        focus: "Start every project with a written plan. Compare at least 2 approaches before building. Document what you build and why.",
        projects: [
          {
            title: "Task Manager with Architecture Decision",
            description: "Build a task management app. Before coding, write a 1-page design doc comparing 2 different approaches (e.g., local storage vs. database, SPA vs. MPA). Choose one and document why.",
            deliverables: [
              "1-page design doc with 2 alternatives compared",
              "Documented decision with one tradeoff explained",
              "Working app with CRUD operations",
              "15+ tests covering happy path and one error case",
              "README with architecture section",
            ],
            skills: ["Architecture Selection", "Scope Discipline", "Testing & Validation"],
          },
          {
            title: "Bug Fix Documentation Practice",
            description: "Take an existing open-source project (or your own), find 3 bugs, and fix them. For each bug, write: what the symptom was, what caused it, and how you fixed it.",
            deliverables: [
              "3 bug fix write-ups with symptom → cause → fix format",
              "Before/after code snippets for each fix",
              "Verification that each fix actually works",
            ],
            skills: ["Iteration Methodology", "Documentation & Artifacts"],
          },
        ],
      },
      {
        phase: "60-90",
        label: "Integration: Ship Something Real",
        focus: "Build and deploy a project that someone else can use. Define scope boundaries before starting. Include domain-specific considerations.",
        projects: [
          {
            title: "Domain-Specific Tool with Deployment",
            description: "Build a tool for a specific domain you know (e.g., recipe converter for cooking, workout tracker for fitness, budget calculator for personal finance). Research one domain standard or convention and incorporate it.",
            deliverables: [
              "Written scope document with in-scope and out-of-scope sections",
              "One domain reference cited in documentation",
              "Deployed application (Vercel, Netlify, or similar)",
              "20+ tests including edge cases",
              "Installation instructions that another person can follow",
            ],
            skills: ["Domain Grounding", "Production Orientation", "Scope Discipline"],
          },
          {
            title: "Peer Review Exchange",
            description: "Find another vibe coder and review each other's code. Write structured feedback covering: architecture, testing, documentation, and deployment readiness.",
            deliverables: [
              "Written review of peer's project (1-2 pages)",
              "Received review of your project",
              "Action items from review incorporated into your project",
            ],
            skills: ["Documentation & Artifacts", "Production Orientation"],
          },
        ],
      },
    ],
  },
  Practitioner: {
    tier: "Practitioner",
    primaryFocus: "Move from iteration to architecture. Think before you prompt. Make technical decisions explicit and defensible.",
    phases: [
      {
        phase: "0-30",
        label: "Foundation: Architect Before You Prompt",
        focus: "Write design documents before every project. Evaluate tradeoffs explicitly. Start treating architecture as a first-class deliverable.",
        projects: [
          {
            title: "Architecture Decision Record (ADR) Practice",
            description: "For your next project, write 3 ADRs before writing any code. Each ADR should document the decision, alternatives considered, tradeoffs, and rationale. Use the standard ADR template.",
            deliverables: [
              "3 ADRs following standard template (Title, Status, Context, Decision, Consequences)",
              "Each ADR compares 2+ alternatives with explicit tradeoffs",
              "Project built following the documented decisions",
              "Post-mortem note on whether the decisions held up",
            ],
            skills: ["Architecture Selection", "Documentation & Artifacts", "Problem Framing"],
          },
          {
            title: "System Design Kata: URL Shortener",
            description: "Design a URL shortener from scratch. Document the full system design: data model, API design, scaling considerations, and deployment topology. Build a working prototype that matches your design.",
            deliverables: [
              "System design document with data model diagram",
              "API specification with 3+ endpoints",
              "Documented scaling strategy (what happens at 1K, 10K, 100K users)",
              "Working prototype deployed with basic analytics",
              "Integration test suite with 20+ tests",
            ],
            skills: ["Architecture Selection", "Production Orientation", "Testing & Validation"],
          },
        ],
      },
      {
        phase: "30-60",
        label: "Structure: Root Cause and Real Data",
        focus: "Move from symptom-fixing to root cause analysis. Test with real data, not just synthetic examples. Build scope discipline into your workflow.",
        projects: [
          {
            title: "Data Pipeline with Validation Framework",
            description: "Build a data processing pipeline that ingests real-world data (public API, CSV dataset, etc.). Implement schema validation, error handling, and distinguish between in-sample and out-of-sample testing.",
            deliverables: [
              "Pipeline processing real data from a public source",
              "Schema validation with meaningful error messages",
              "Test suite with real data fixtures (not just mocks)",
              "Documented distinction between test data and validation data",
              "Root cause analysis for at least 2 bugs encountered during development",
            ],
            skills: ["Testing & Validation", "Iteration Methodology", "Domain Grounding"],
          },
          {
            title: "Scope-Controlled Feature Build",
            description: "Build a feature-rich application (e.g., a dashboard, a content management tool) but with strict scope control. Write a scope document with P0/P1/P2 features. Ship only P0, document why P1 and P2 were deferred.",
            deliverables: [
              "Scope document with P0/P1/P2 feature tiers",
              "Working application with all P0 features complete",
              "Written rationale for each P1/P2 deferral",
              "Post-project reflection on scope discipline",
            ],
            skills: ["Scope Discipline", "Problem Framing", "Documentation & Artifacts"],
          },
        ],
      },
      {
        phase: "60-90",
        label: "Integration: Production-Grade Delivery",
        focus: "Build something production-ready with CLI/API interfaces, proper error handling, and documentation for multiple audiences. Research your domain before building.",
        projects: [
          {
            title: "Open-Source CLI Tool with Domain Research",
            description: "Build and publish a CLI tool in a domain you're interested in. Research existing tools in the space, document how yours differs, and include domain-specific standards or conventions.",
            deliverables: [
              "CLI tool with 3+ subcommands and help text",
              "Comparison document: your tool vs. 2 existing alternatives",
              "Domain standards research (1-2 references cited)",
              "Published to npm/PyPI with semantic versioning",
              "README with installation, usage, and architecture sections",
              "Integration test suite with 30+ tests",
            ],
            skills: ["Domain Grounding", "Production Orientation", "Architecture Selection"],
          },
          {
            title: "Technical Blog Post: Design Decisions",
            description: "Write and publish a technical blog post about a design decision you made in one of your projects. Include alternatives considered, tradeoffs evaluated, and lessons learned.",
            deliverables: [
              "Published blog post (1500-2500 words)",
              "Includes architecture diagram or code examples",
              "References at least 2 external sources",
              "Shared with at least one technical community",
            ],
            skills: ["Documentation & Artifacts", "Domain Grounding"],
          },
        ],
      },
    ],
  },
  Senior: {
    tier: "Senior",
    primaryFocus: "Broaden impact beyond your own projects. Contribute to the field through publishing, teaching, or building production systems that others depend on.",
    phases: [
      {
        phase: "0-30",
        label: "Foundation: Research-Grounded Building",
        focus: "Ground every project in literature review and domain research. Build formal improvement cycles into your development process.",
        projects: [
          {
            title: "Literature-Grounded System Design",
            description: "Choose a technical problem in your domain. Conduct a mini literature review (5+ sources: papers, blog posts, industry reports). Design a system that addresses a gap you identified in existing solutions.",
            deliverables: [
              "Literature review document with 5+ sources synthesized",
              "Gap analysis: what existing solutions miss",
              "System design document grounded in research findings",
              "Working prototype with novel approach documented",
              "Formal improvement cycle with numbered work items",
            ],
            skills: ["Domain Grounding", "Problem Framing", "Iteration Methodology"],
          },
          {
            title: "Structured Improvement Cycle Practice",
            description: "Take an existing project and run a formal improvement cycle. Create numbered work items (P1-P5), run options analysis for each, measure impact before and after.",
            deliverables: [
              "5 numbered work items with priority labels",
              "Options analysis for top 3 items (3+ alternatives each)",
              "Before/after metrics for each improvement",
              "Documented improvement cycle as a project phase",
            ],
            skills: ["Iteration Methodology", "Testing & Validation"],
          },
        ],
      },
      {
        phase: "30-60",
        label: "Structure: Production Systems and Audiences",
        focus: "Build systems designed for production from day one. Create documentation for multiple audiences. Design for specific non-functional requirements.",
        projects: [
          {
            title: "Multi-Audience Documentation Project",
            description: "Take your best project and create documentation for 3 different audiences: developers (technical spec), stakeholders (business brief), and operators (deployment guide). Each document should stand alone.",
            deliverables: [
              "Technical specification with API reference and architecture diagram",
              "Business brief explaining value proposition and metrics",
              "Deployment guide with infrastructure requirements and runbook",
              "Each document reviewed by someone from the target audience",
            ],
            skills: ["Documentation & Artifacts", "Production Orientation"],
          },
          {
            title: "Production-Designed Microservice",
            description: "Build a microservice designed for production properties: define SLAs, implement health checks, add observability (logging, metrics), and document the deployment topology.",
            deliverables: [
              "Microservice with defined SLA targets",
              "Health check endpoints and readiness probes",
              "Structured logging and basic metrics",
              "Deployment topology diagram (containers, networking)",
              "Load test results with performance baseline",
              "Formal validation rubric with multiple metrics",
            ],
            skills: ["Production Orientation", "Architecture Selection", "Testing & Validation"],
          },
        ],
      },
      {
        phase: "60-90",
        label: "Integration: Publish and Scale Impact",
        focus: "Publish technical artifacts that others cite or use. Build systems with monetization or business model analysis. Contribute to the paradigm.",
        projects: [
          {
            title: "Open-Source Library with Novel Contribution",
            description: "Build and publish an open-source library that addresses a gap you identified through research. Include a clear articulation of what's novel about your approach compared to all existing alternatives.",
            deliverables: [
              "Published library with semantic versioning and CI/CD",
              "Documentation with novel contribution clearly stated",
              "Comparison matrix: your library vs. 3+ alternatives",
              "10+ GitHub stars or equivalent community validation",
              "Technical blog post or conference talk proposal",
            ],
            skills: ["Domain Grounding", "Production Orientation", "Documentation & Artifacts"],
          },
          {
            title: "Business Model Analysis for a Technical Product",
            description: "Take one of your projects and analyze it as a product. Document monetization paths, competitive positioning, go-to-market strategy, and production cost analysis.",
            deliverables: [
              "Monetization analysis with 2-3 revenue model options",
              "Competitive landscape document with positioning",
              "Production cost estimate (infrastructure, maintenance)",
              "Go-to-market brief with target audience and channels",
            ],
            skills: ["Production Orientation", "Scope Discipline"],
          },
        ],
      },
    ],
  },
  Principal: {
    tier: "Principal",
    primaryFocus: "Ship and scale. Turn architectures into production systems and products. Close execution gaps between design and delivery.",
    phases: [
      {
        phase: "0-30",
        label: "Foundation: Close Your Execution Gap",
        focus: "Identify your biggest gap between architecture and delivery. If you design but don't deploy, learn infrastructure. If you build but don't monetize, learn business models.",
        projects: [
          {
            title: "Execution Gap Audit and Remediation",
            description: "Audit your last 5 projects. For each, identify where the gap between design quality and execution quality was largest. Build a targeted remediation plan and execute on the top gap.",
            deliverables: [
              "Audit document covering 5 projects with gap analysis",
              "Ranked list of execution gaps with evidence",
              "Remediation plan for top gap with measurable targets",
              "Completed remediation with before/after comparison",
            ],
            skills: ["Problem Framing", "Iteration Methodology"],
          },
          {
            title: "Infrastructure-as-Code for Your Best Project",
            description: "Take your most architecturally sound project and make it production-real: Dockerfile, CI/CD pipeline, monitoring, alerting, and automated deployment. If you already do this, add cost optimization and auto-scaling.",
            deliverables: [
              "Dockerfile with multi-stage build",
              "CI/CD pipeline (GitHub Actions or similar)",
              "Monitoring dashboard with 3+ key metrics",
              "Automated deployment to cloud provider",
              "Cost analysis and optimization recommendations",
            ],
            skills: ["Production Orientation", "Architecture Selection"],
          },
        ],
      },
      {
        phase: "30-60",
        label: "Structure: Build for Others to Use and Pay For",
        focus: "Build something that others depend on. Validate with real users. Implement monetization or measure real-world impact.",
        projects: [
          {
            title: "Validated Product with Real Users",
            description: "Launch a product (tool, API, service) to real users. Collect usage data, iterate based on feedback, and document the validation methodology. Target: 10+ active users or 100+ API calls.",
            deliverables: [
              "Launched product with onboarding flow",
              "Usage analytics dashboard",
              "User feedback collection and synthesis (5+ users)",
              "2 iteration cycles based on real user data",
              "Validation report with statistical analysis of usage patterns",
            ],
            skills: ["Production Orientation", "Testing & Validation", "Domain Grounding"],
          },
          {
            title: "Paradigm Contribution: Framework or Methodology",
            description: "Codify a methodology, framework, or pattern you've developed through your work. Package it for others to adopt: documentation, examples, and a reference implementation.",
            deliverables: [
              "Methodology document with principles and practices",
              "Reference implementation with annotated code",
              "3+ worked examples showing the methodology applied",
              "Comparison to existing methodologies with differentiation",
              "Published to a community (blog, conference, open-source)",
            ],
            skills: ["Domain Grounding", "Documentation & Artifacts", "Problem Framing"],
          },
        ],
      },
      {
        phase: "60-90",
        label: "Integration: Scale Impact and Revenue",
        focus: "Scale what works. Grow users, revenue, or citations. Build the team or community around your work.",
        projects: [
          {
            title: "Revenue or Citation Milestone",
            description: "Take your validated product or published work and push for a scale milestone: first paying customer, first citation, first contributor, or first 100 users. Document the scaling strategy and results.",
            deliverables: [
              "Scaling strategy document with targets and tactics",
              "Evidence of milestone achieved (revenue, citations, users, contributors)",
              "Retrospective on what worked and what didn't",
              "Next-phase plan for continued scaling",
            ],
            skills: ["Production Orientation", "Scope Discipline"],
          },
          {
            title: "Mentorship and Knowledge Transfer",
            description: "Mentor 1-2 junior vibe coders through a project. Document the teaching methodology, common stumbling blocks, and how you adapted your guidance. This tests whether your knowledge is transferable.",
            deliverables: [
              "Mentorship log with session notes",
              "Documented teaching methodology",
              "Mentee project completed with your guidance",
              "Reflection on knowledge transfer effectiveness",
              "Reusable teaching materials for future mentors",
            ],
            skills: ["Documentation & Artifacts", "Problem Framing", "Domain Grounding"],
          },
        ],
      },
    ],
  },
};
