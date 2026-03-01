/**
 * Chat Assessment Page
 * Structured branching interview → LLM evaluation → personalized growth plan
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Loader2,
  Activity,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  Shield,
  FileText,
  Globe,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import {
  type InterviewState,
  type InterviewQuestion,
  getInitialState,
  getCurrentQuestion,
  advanceState,
  buildTranscript,
  getProgress,
  getStageLabel,
  ATTRIBUTE_PROBES,
} from "@/lib/interviewData";

interface ChatMessage {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  questionId?: string;
}

const ATTRIBUTE_ICONS = [Target, Zap, BarChart3, Activity, Shield, FileText, Globe, Rocket];

const INTRO_MESSAGE = `Welcome to the **Vibe Coder Assessment**.

This is a conversational evaluation — not a self-labeling exercise. I'll ask you about a **real project** you've worked on recently, then probe your process across 8 competency attributes.

Your answers will be evaluated against the rubric to determine your maturity tier. Be specific and honest — describe what you **actually did**, not what you wish you'd done.

Let's start with your project.`;

type AssessmentPhase = "interview" | "evaluating" | "results" | "growth-plan" | "growth-loading";

interface EvaluationResult {
  scores: Array<{
    attribute: string;
    score: number;
    evidence: string;
    reasoning: string;
  }>;
  compositeScore: number;
  compositeTier: string;
  narrative: string;
  topStrengths: string[];
  criticalGaps: string[];
}

interface GrowthPlanResult {
  currentTier: string;
  targetTier: string;
  primaryFocus: string;
  phases: Array<{
    phase: string;
    theme: string;
    objectives: string[];
    project: {
      title: string;
      description: string;
      deliverables: string[];
      successCriteria: string[];
    };
    instructions: string[];
  }>;
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "Novice": return "text-red-400";
    case "Practitioner": return "text-amber-400";
    case "Senior": return "text-cyan-400";
    case "Principal": return "text-emerald-400";
    default: return "text-primary";
  }
}

function getTierBg(tier: string): string {
  switch (tier) {
    case "Novice": return "bg-red-400/10 border-red-400/30";
    case "Practitioner": return "bg-amber-400/10 border-amber-400/30";
    case "Senior": return "bg-cyan-400/10 border-cyan-400/30";
    case "Principal": return "bg-emerald-400/10 border-emerald-400/30";
    default: return "bg-primary/10 border-primary/30";
  }
}

function getScoreColor(score: number): string {
  if (score <= 1) return "text-red-400";
  if (score <= 2) return "text-amber-400";
  if (score <= 3) return "text-cyan-400";
  return "text-emerald-400";
}

function getScoreBarColor(score: number): string {
  if (score <= 1) return "bg-red-400";
  if (score <= 2) return "bg-amber-400";
  if (score <= 3) return "bg-cyan-400";
  return "bg-emerald-400";
}

export default function ChatAssessment() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<AssessmentPhase>("interview");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "intro", role: "assistant", content: INTRO_MESSAGE },
  ]);
  const [interviewState, setInterviewState] = useState<InterviewState>(getInitialState);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [growthPlan, setGrowthPlan] = useState<GrowthPlanResult | null>(null);
  const [activePhaseTab, setActivePhaseTab] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const evaluateMutation = trpc.assessment.evaluate.useMutation();
  const growthPlanMutation = trpc.assessment.generateGrowthPlan.useMutation();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Ask the first question after intro
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstQ = getCurrentQuestion(interviewState);
      if (firstQ) {
        setMessages(prev => [
          ...prev,
          { id: firstQ.id + "-q", role: "assistant", content: firstQ.text, questionId: firstQ.id },
        ]);
      }
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || phase !== "interview") return;

    const currentQ = getCurrentQuestion(interviewState);
    if (!currentQ) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      questionId: currentQ.id,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Advance state
    const newState = advanceState(interviewState, currentQ.id, trimmed);
    setInterviewState(newState);

    // Determine next question or completion
    setTimeout(() => {
      if (newState.stage.type === "complete") {
        // Interview complete → evaluate
        setMessages(prev => [
          ...prev,
          {
            id: "complete-msg",
            role: "assistant",
            content: "Thank you for walking me through your project. I have everything I need.\n\nI'm now evaluating your responses against the rubric across all 8 attributes. This takes about 15-30 seconds.",
          },
        ]);
        setIsTyping(false);
        setPhase("evaluating");

        // Trigger LLM evaluation
        const transcript = buildTranscript(newState);
        evaluateMutation.mutate(
          { transcript },
          {
            onSuccess: (result) => {
              setEvaluation(result as EvaluationResult);
              setPhase("results");
            },
            onError: (error) => {
              setMessages(prev => [
                ...prev,
                {
                  id: "error-msg",
                  role: "assistant",
                  content: `Something went wrong during evaluation: ${error.message}. Please try again.`,
                },
              ]);
              setPhase("interview");
            },
          }
        );
      } else {
        // Ask next question
        const nextQ = getCurrentQuestion(newState);
        if (nextQ) {
          // Add a transition message for new attributes
          const prevAttribute = currentQ.attribute;
          const nextAttribute = nextQ.attribute;
          
          if (nextQ.stage === "probing" && nextQ.questionType === "primary" && prevAttribute !== nextAttribute) {
            const attrIndex = ATTRIBUTE_PROBES.findIndex(p => p.attribute === nextAttribute);
            const Icon = ATTRIBUTE_ICONS[attrIndex] || Activity;
            setMessages(prev => [
              ...prev,
              {
                id: `transition-${nextAttribute}`,
                role: "assistant",
                content: `Moving on to **${nextAttribute}**.`,
              },
            ]);
            setTimeout(() => {
              setMessages(prev => [
                ...prev,
                { id: nextQ.id + "-q", role: "assistant", content: nextQ.text, questionId: nextQ.id },
              ]);
              setIsTyping(false);
            }, 800);
          } else {
            setMessages(prev => [
              ...prev,
              { id: nextQ.id + "-q", role: "assistant", content: nextQ.text, questionId: nextQ.id },
            ]);
            setIsTyping(false);
          }
        }
      }
    }, 600);
  }, [input, isTyping, phase, interviewState, evaluateMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateGrowthPlan = () => {
    if (!evaluation) return;
    setPhase("growth-loading");

    const transcript = buildTranscript(interviewState);
    growthPlanMutation.mutate(
      { transcript, evaluation },
      {
        onSuccess: (result) => {
          setGrowthPlan(result as GrowthPlanResult);
          setPhase("growth-plan");
        },
        onError: () => {
          setPhase("results");
        },
      }
    );
  };

  const progress = getProgress(interviewState);
  const stageLabel = getStageLabel(interviewState);

  // --- RENDER ---

  // Results view
  if (phase === "results" && evaluation) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container max-w-4xl py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold">Assessment Results</h1>
              <p className="text-sm text-muted-foreground">Based on your interview responses</p>
            </div>
          </div>

          {/* Tier Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl border p-8 mb-8 text-center ${getTierBg(evaluation.compositeTier)}`}
          >
            <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wider">Composite Maturity Tier</p>
            <h2 className={`font-display text-5xl font-bold mb-2 ${getTierColor(evaluation.compositeTier)}`}>
              {evaluation.compositeTier}
            </h2>
            <p className="font-mono text-2xl text-foreground/80">
              {evaluation.compositeScore} <span className="text-muted-foreground text-lg">/ 32</span>
            </p>
          </motion.div>

          {/* Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6 mb-8"
          >
            <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Assessment Narrative
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
              <Streamdown>{evaluation.narrative}</Streamdown>
            </div>
          </motion.div>

          {/* Strengths & Gaps */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6"
            >
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                Top Strengths
              </h3>
              <ul className="space-y-2">
                {evaluation.topStrengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-6"
            >
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                Critical Gaps
              </h3>
              <ul className="space-y-2">
                {evaluation.criticalGaps.map((g, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                    {g}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Per-Attribute Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-border bg-card p-6 mb-8"
          >
            <h3 className="font-display text-lg font-semibold mb-6">Attribute Breakdown</h3>
            <div className="space-y-5">
              {evaluation.scores.map((score, i) => {
                const Icon = ATTRIBUTE_ICONS[i] || Activity;
                return (
                  <div key={score.attribute}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${getScoreColor(score.score)}`} />
                        <span className="text-sm font-medium text-card-foreground">{score.attribute}</span>
                      </div>
                      <span className={`font-mono text-sm font-bold ${getScoreColor(score.score)}`}>
                        {score.score}/4
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(score.score / 4) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                        className={`h-full rounded-full ${getScoreBarColor(score.score)}`}
                      />
                    </div>
                    <details className="group">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        View evidence & reasoning
                      </summary>
                      <div className="mt-2 pl-6 border-l border-border space-y-1">
                        <p className="text-xs text-foreground/70">
                          <span className="font-semibold text-foreground/90">Evidence:</span> {score.evidence}
                        </p>
                        <p className="text-xs text-foreground/70">
                          <span className="font-semibold text-foreground/90">Reasoning:</span> {score.reasoning}
                        </p>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Button
              size="lg"
              onClick={handleGenerateGrowthPlan}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display text-base px-8 h-12"
            >
              Generate My 30-60-90 Day Growth Plan
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Personalized to your project, scores, and identified gaps
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Growth plan loading
  if (phase === "growth-loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Generating Your Growth Plan</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Building a personalized 30-60-90 day plan with projects tailored to your assessment results and specific gaps...
          </p>
        </div>
      </div>
    );
  }

  // Growth plan view
  if (phase === "growth-plan" && growthPlan) {
    const currentPhase = growthPlan.phases[activePhaseTab];
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container max-w-4xl py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setPhase("results")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold">Your Growth Plan</h1>
              <p className="text-sm text-muted-foreground">
                {growthPlan.currentTier} → {growthPlan.targetTier}
              </p>
            </div>
          </div>

          {/* Primary Focus */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-8">
            <p className="text-sm font-mono text-primary/70 uppercase tracking-wider mb-1">Primary Focus</p>
            <p className="text-lg text-foreground font-medium">{growthPlan.primaryFocus}</p>
          </div>

          {/* Phase Tabs */}
          <div className="flex gap-2 mb-8">
            {growthPlan.phases.map((p, i) => (
              <button
                key={i}
                onClick={() => setActivePhaseTab(i)}
                className={`flex-1 rounded-lg border px-4 py-3 text-center transition-all ${
                  activePhaseTab === i
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="block text-xs font-mono uppercase tracking-wider mb-0.5">{p.phase}</span>
                <span className="block text-sm font-medium">{p.theme}</span>
              </button>
            ))}
          </div>

          {/* Phase Content */}
          {currentPhase && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePhaseTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Objectives */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Objectives
                  </h3>
                  <ul className="space-y-2">
                    {currentPhase.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-card-foreground">
                        <span className="font-mono text-primary/60 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Project */}
                <div className="rounded-xl border border-primary/20 bg-card p-6">
                  <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    Project: {currentPhase.project.title}
                  </h3>
                  <p className="text-sm text-card-foreground/80 mb-4">{currentPhase.project.description}</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">Deliverables</h4>
                      <ul className="space-y-1">
                        {currentPhase.project.deliverables.map((d, i) => (
                          <li key={i} className="text-sm text-card-foreground/80 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary/50 mt-0.5 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">Success Criteria</h4>
                      <ul className="space-y-1">
                        {currentPhase.project.successCriteria.map((c, i) => (
                          <li key={i} className="text-sm text-card-foreground/80 flex items-start gap-2">
                            <Shield className="w-3.5 h-3.5 text-amber-400/50 mt-0.5 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step-by-step Instructions */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Step-by-Step Instructions
                  </h3>
                  <ol className="space-y-3">
                    {currentPhase.instructions.map((inst, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-card-foreground/80">{inst}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setActivePhaseTab(Math.max(0, activePhaseTab - 1))}
              disabled={activePhaseTab === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Previous Phase
            </Button>
            <Button
              variant="outline"
              onClick={() => setActivePhaseTab(Math.min(growthPlan.phases.length - 1, activePhaseTab + 1))}
              disabled={activePhaseTab === growthPlan.phases.length - 1}
            >
              Next Phase
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Evaluating state
  if (phase === "evaluating") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container flex items-center gap-3 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold">Vibe Coder Assessment</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Evaluating Your Responses</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Scoring your interview against the rubric across all 8 attributes. This takes about 15-30 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Interview (chat) view
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Activity className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <span className="font-display font-semibold text-sm">Vibe Coder Assessment</span>
            <span className="text-xs text-muted-foreground ml-2 font-mono">
              {stageLabel}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-0.5 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden" ref={scrollRef}>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="container max-w-3xl py-6 space-y-4">
            {messages.filter(m => m.role !== "system").map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-card-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-3xl py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 items-end"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your actual experience..."
              disabled={phase !== "interview" || isTyping}
              className="flex-1 max-h-32 resize-none min-h-[42px] bg-background"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping || phase !== "interview"}
              className="shrink-0 h-[42px] w-[42px]"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Be specific about what you actually did. Vague answers score lower.
          </p>
        </div>
      </div>
    </div>
  );
}
