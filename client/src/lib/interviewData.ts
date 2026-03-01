/**
 * Structured Branching Interview Protocol
 * Deterministic state machine for behavioral assessment
 * 
 * Stage 1: Project Grounding (2 questions)
 * Stage 2: Attribute Probing (8 attributes × primary + follow-up)
 * Stage 3: Completion → LLM evaluation
 */

export interface InterviewQuestion {
  id: string;
  stage: "grounding" | "probing" | "completion";
  attribute?: string;
  attributeIndex?: number;
  questionType: "primary" | "followup-depth" | "followup-awareness" | "grounding";
  text: string;
}

export interface AttributeProbe {
  attribute: string;
  attributeIndex: number;
  primary: InterviewQuestion;
  followUpDepth: InterviewQuestion;   // Follow-up A: probes for depth (evidence of structure)
  followUpAwareness: InterviewQuestion; // Follow-up B: probes for awareness (vague/negative)
  /** Keywords that indicate the user has evidence/structure → route to depth follow-up */
  depthSignals: string[];
}

// Stage 1: Project Grounding
export const GROUNDING_QUESTIONS: InterviewQuestion[] = [
  {
    id: "ground-1",
    stage: "grounding",
    questionType: "grounding",
    text: "Tell me about a project you completed in the last 30-60 days. What were you building and what problem were you trying to solve?",
  },
  {
    id: "ground-2",
    stage: "grounding",
    questionType: "grounding",
    text: "Was this a solo project or collaborative? How long did it take from start to its current state?",
  },
];

// Stage 2: Attribute Probes
export const ATTRIBUTE_PROBES: AttributeProbe[] = [
  {
    attribute: "Problem Framing",
    attributeIndex: 0,
    primary: {
      id: "pf-primary",
      stage: "probing",
      attribute: "Problem Framing",
      attributeIndex: 0,
      questionType: "primary",
      text: "Before you started building, did you write anything down about the problem you were solving? If so, what did that look like?",
    },
    followUpDepth: {
      id: "pf-depth",
      stage: "probing",
      attribute: "Problem Framing",
      attributeIndex: 0,
      questionType: "followup-depth",
      text: "Can you describe what was in that document? Did it include goals, non-goals, or success criteria?",
    },
    followUpAwareness: {
      id: "pf-aware",
      stage: "probing",
      attribute: "Problem Framing",
      attributeIndex: 0,
      questionType: "followup-awareness",
      text: "How did you decide what to build first? What guided your initial prompts to the AI?",
    },
    depthSignals: ["wrote", "document", "readme", "doc", "notes", "spec", "requirements", "user story", "problem statement", "goals", "plan", "outlined", "defined", "scope", "brief", "design doc", "yes"],
  },
  {
    attribute: "Architecture Selection",
    attributeIndex: 1,
    primary: {
      id: "as-primary",
      stage: "probing",
      attribute: "Architecture Selection",
      attributeIndex: 1,
      questionType: "primary",
      text: "What tech stack or architecture did you use for this project? How did you arrive at that choice?",
    },
    followUpDepth: {
      id: "as-depth",
      stage: "probing",
      attribute: "Architecture Selection",
      attributeIndex: 1,
      questionType: "followup-depth",
      text: "What alternatives did you consider? What made you pick this one over the others?",
    },
    followUpAwareness: {
      id: "as-aware",
      stage: "probing",
      attribute: "Architecture Selection",
      attributeIndex: 1,
      questionType: "followup-awareness",
      text: "If you were starting over, would you choose the same stack? What would you change and why?",
    },
    depthSignals: ["compared", "evaluated", "alternatives", "considered", "chose", "because", "tradeoff", "researched", "looked at", "options", "decided between", "weighed", "pros and cons", "versus"],
  },
  {
    attribute: "Scope Discipline",
    attributeIndex: 2,
    primary: {
      id: "sd-primary",
      stage: "probing",
      attribute: "Scope Discipline",
      attributeIndex: 2,
      questionType: "primary",
      text: "Did the project end up being what you originally planned, or did it change along the way? How?",
    },
    followUpDepth: {
      id: "sd-depth",
      stage: "probing",
      attribute: "Scope Discipline",
      attributeIndex: 2,
      questionType: "followup-depth",
      text: "At what point did you realize the scope was shifting? Did you document what was in-scope vs. out-of-scope?",
    },
    followUpAwareness: {
      id: "sd-aware",
      stage: "probing",
      attribute: "Scope Discipline",
      attributeIndex: 2,
      questionType: "followup-awareness",
      text: "How did you decide what NOT to build? Were there features you deliberately excluded?",
    },
    depthSignals: ["changed", "grew", "expanded", "added", "scope creep", "shifted", "evolved", "different", "more than", "pivoted", "drifted", "wasn't planned"],
  },
  {
    attribute: "Iteration Methodology",
    attributeIndex: 3,
    primary: {
      id: "im-primary",
      stage: "probing",
      attribute: "Iteration Methodology",
      attributeIndex: 3,
      questionType: "primary",
      text: "When something wasn't working during development, how did you figure out what was wrong and fix it?",
    },
    followUpDepth: {
      id: "im-depth",
      stage: "probing",
      attribute: "Iteration Methodology",
      attributeIndex: 3,
      questionType: "followup-depth",
      text: "Can you walk me through a specific bug or issue? What was the symptom, what was the root cause, and how did you find it?",
    },
    followUpAwareness: {
      id: "im-aware",
      stage: "probing",
      attribute: "Iteration Methodology",
      attributeIndex: 3,
      questionType: "followup-awareness",
      text: "How many times did you typically re-prompt the AI before something worked? Did you change your approach or just retry?",
    },
    depthSignals: ["debugged", "traced", "root cause", "investigated", "analyzed", "logs", "console", "stack trace", "breakpoint", "isolated", "narrowed down", "figured out why", "diagnosed", "systematic"],
  },
  {
    attribute: "Testing & Validation",
    attributeIndex: 4,
    primary: {
      id: "tv-primary",
      stage: "probing",
      attribute: "Testing & Validation",
      attributeIndex: 4,
      questionType: "primary",
      text: "Does this project have tests? Tell me about your testing approach.",
    },
    followUpDepth: {
      id: "tv-depth",
      stage: "probing",
      attribute: "Testing & Validation",
      attributeIndex: 4,
      questionType: "followup-depth",
      text: "What kinds of things do your tests cover? Are there edge cases or error scenarios included?",
    },
    followUpAwareness: {
      id: "tv-aware",
      stage: "probing",
      attribute: "Testing & Validation",
      attributeIndex: 4,
      questionType: "followup-awareness",
      text: "How do you know the project works correctly? What did you do to verify it?",
    },
    depthSignals: ["test", "tests", "jest", "vitest", "pytest", "unit test", "integration", "coverage", "spec", "assertion", "expect", "describe", "it(", "suite", "automated", "ci", "yes"],
  },
  {
    attribute: "Documentation & Artifacts",
    attributeIndex: 5,
    primary: {
      id: "da-primary",
      stage: "probing",
      attribute: "Documentation & Artifacts",
      attributeIndex: 5,
      questionType: "primary",
      text: "If I cloned your project right now, what documentation would I find? Could I get it running without asking you questions?",
    },
    followUpDepth: {
      id: "da-depth",
      stage: "probing",
      attribute: "Documentation & Artifacts",
      attributeIndex: 5,
      questionType: "followup-depth",
      text: "Who is the documentation written for? Is it just setup instructions, or does it explain the why behind decisions?",
    },
    followUpAwareness: {
      id: "da-aware",
      stage: "probing",
      attribute: "Documentation & Artifacts",
      attributeIndex: 5,
      questionType: "followup-awareness",
      text: "If you had to hand this project to someone else tomorrow, what would they struggle with?",
    },
    depthSignals: ["readme", "documentation", "docs", "comments", "docstring", "api reference", "guide", "instructions", "setup", "architecture", "design doc", "yes", "wiki"],
  },
  {
    attribute: "Domain Grounding",
    attributeIndex: 6,
    primary: {
      id: "dg-primary",
      stage: "probing",
      attribute: "Domain Grounding",
      attributeIndex: 6,
      questionType: "primary",
      text: "How much did you know about the problem domain before starting? Did you do any research into how this problem is typically solved?",
    },
    followUpDepth: {
      id: "dg-depth",
      stage: "probing",
      attribute: "Domain Grounding",
      attributeIndex: 6,
      questionType: "followup-depth",
      text: "What sources did you look at? Did any domain knowledge change how you designed the solution?",
    },
    followUpAwareness: {
      id: "dg-aware",
      stage: "probing",
      attribute: "Domain Grounding",
      attributeIndex: 6,
      questionType: "followup-awareness",
      text: "Were there any domain-specific conventions or standards that applied to your project? How did you handle them?",
    },
    depthSignals: ["researched", "read", "paper", "article", "standard", "convention", "industry", "best practice", "reference", "studied", "looked up", "prior art", "existing solutions", "literature", "framework"],
  },
  {
    attribute: "Production Orientation",
    attributeIndex: 7,
    primary: {
      id: "po-primary",
      stage: "probing",
      attribute: "Production Orientation",
      attributeIndex: 7,
      questionType: "primary",
      text: "Is this project deployed and usable by someone other than you? What would need to happen to make it production-ready?",
    },
    followUpDepth: {
      id: "po-depth",
      stage: "probing",
      attribute: "Production Orientation",
      attributeIndex: 7,
      questionType: "followup-depth",
      text: "What happens if something breaks in production? Do you have error handling, monitoring, or a way to know?",
    },
    followUpAwareness: {
      id: "po-aware",
      stage: "probing",
      attribute: "Production Orientation",
      attributeIndex: 7,
      questionType: "followup-awareness",
      text: "What's stopping you from deploying it? What would you need to add?",
    },
    depthSignals: ["deployed", "live", "production", "vercel", "netlify", "heroku", "aws", "docker", "users", "people use", "shipped", "launched", "hosting", "domain", "yes"],
  },
];

/**
 * Deterministic branching logic:
 * Classify a user response to determine which follow-up to ask.
 * Returns true if the response shows evidence of structure/depth (→ follow-up A),
 * false if vague/negative (→ follow-up B).
 */
export function classifyResponse(response: string, depthSignals: string[]): boolean {
  const lower = response.toLowerCase();
  
  // Negative signals that override depth signals
  const negativeSignals = [
    "no", "not really", "didn't", "don't", "nope", "nothing", "none",
    "just started", "jumped in", "dove in", "went straight", "immediately",
    "whatever the ai", "what it gave me", "default",
  ];
  
  // Check for strong negative signals first
  const hasStrongNegative = negativeSignals.some(signal => {
    // Match "no" only as a word boundary, not inside other words
    if (signal === "no") {
      return /\bno\b/.test(lower) && lower.length < 80;
    }
    return lower.includes(signal);
  });
  
  // Check for depth signals
  const hasDepthSignal = depthSignals.some(signal => lower.includes(signal));
  
  // If the response is very short (< 30 chars), lean toward awareness follow-up
  if (lower.length < 30 && !hasDepthSignal) {
    return false;
  }
  
  // Depth signals win unless there's a strong negative
  if (hasDepthSignal && !hasStrongNegative) {
    return true;
  }
  
  // Default to awareness follow-up
  return false;
}

/**
 * Interview state machine
 */
export type InterviewStage = 
  | { type: "grounding"; questionIndex: number }
  | { type: "probing"; attributeIndex: number; phase: "primary" | "followup" }
  | { type: "complete" };

export interface InterviewState {
  stage: InterviewStage;
  responses: Map<string, string>; // questionId → response
  projectContext: string; // Combined grounding responses
}

export function getInitialState(): InterviewState {
  return {
    stage: { type: "grounding", questionIndex: 0 },
    responses: new Map(),
    projectContext: "",
  };
}

export function getCurrentQuestion(state: InterviewState): InterviewQuestion | null {
  const { stage } = state;
  
  if (stage.type === "grounding") {
    return GROUNDING_QUESTIONS[stage.questionIndex] || null;
  }
  
  if (stage.type === "probing") {
    const probe = ATTRIBUTE_PROBES[stage.attributeIndex];
    if (!probe) return null;
    
    if (stage.phase === "primary") {
      return probe.primary;
    }
    
    // Determine which follow-up based on primary response
    const primaryResponse = state.responses.get(probe.primary.id) || "";
    const isDepth = classifyResponse(primaryResponse, probe.depthSignals);
    return isDepth ? probe.followUpDepth : probe.followUpAwareness;
  }
  
  return null;
}

export function advanceState(state: InterviewState, questionId: string, response: string): InterviewState {
  const newResponses = new Map(state.responses);
  newResponses.set(questionId, response);
  
  const { stage } = state;
  let newProjectContext = state.projectContext;
  
  if (stage.type === "grounding") {
    newProjectContext = state.projectContext + " " + response;
    
    if (stage.questionIndex < GROUNDING_QUESTIONS.length - 1) {
      return {
        stage: { type: "grounding", questionIndex: stage.questionIndex + 1 },
        responses: newResponses,
        projectContext: newProjectContext,
      };
    }
    // Move to probing
    return {
      stage: { type: "probing", attributeIndex: 0, phase: "primary" },
      responses: newResponses,
      projectContext: newProjectContext,
    };
  }
  
  if (stage.type === "probing") {
    if (stage.phase === "primary") {
      // Move to follow-up
      return {
        stage: { type: "probing", attributeIndex: stage.attributeIndex, phase: "followup" },
        responses: newResponses,
        projectContext: newProjectContext,
      };
    }
    
    // Follow-up done, move to next attribute or complete
    const nextIndex = stage.attributeIndex + 1;
    if (nextIndex < ATTRIBUTE_PROBES.length) {
      return {
        stage: { type: "probing", attributeIndex: nextIndex, phase: "primary" },
        responses: newResponses,
        projectContext: newProjectContext,
      };
    }
    
    // All attributes done
    return {
      stage: { type: "complete" },
      responses: newResponses,
      projectContext: newProjectContext,
    };
  }
  
  return state;
}

/**
 * Build the full transcript for LLM evaluation
 */
export function buildTranscript(state: InterviewState): string {
  const lines: string[] = [];
  
  // Grounding
  lines.push("## Project Context");
  for (const q of GROUNDING_QUESTIONS) {
    const response = state.responses.get(q.id);
    if (response) {
      lines.push(`Q: ${q.text}`);
      lines.push(`A: ${response}`);
      lines.push("");
    }
  }
  
  // Attribute probes
  for (const probe of ATTRIBUTE_PROBES) {
    lines.push(`## ${probe.attribute}`);
    
    const primaryResponse = state.responses.get(probe.primary.id);
    if (primaryResponse) {
      lines.push(`Q: ${probe.primary.text}`);
      lines.push(`A: ${primaryResponse}`);
      lines.push("");
    }
    
    // Check which follow-up was asked
    const depthResponse = state.responses.get(probe.followUpDepth.id);
    const awarenessResponse = state.responses.get(probe.followUpAwareness.id);
    
    if (depthResponse) {
      lines.push(`Q: ${probe.followUpDepth.text}`);
      lines.push(`A: ${depthResponse}`);
    } else if (awarenessResponse) {
      lines.push(`Q: ${probe.followUpAwareness.text}`);
      lines.push(`A: ${awarenessResponse}`);
    }
    lines.push("");
  }
  
  return lines.join("\n");
}

/** Total number of questions in the interview */
export const TOTAL_QUESTIONS = GROUNDING_QUESTIONS.length + ATTRIBUTE_PROBES.length * 2;

/** Get progress as a fraction (0-1) */
export function getProgress(state: InterviewState): number {
  return state.responses.size / TOTAL_QUESTIONS;
}

/** Get a human-readable stage label */
export function getStageLabel(state: InterviewState): string {
  const { stage } = state;
  if (stage.type === "grounding") return "Project Context";
  if (stage.type === "probing") {
    return ATTRIBUTE_PROBES[stage.attributeIndex]?.attribute || "Assessment";
  }
  return "Complete";
}
