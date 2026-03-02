/**
 * Chat Assessment Page — LLM-Driven Conversational Assessment
 *
 * Architecture:
 * - Auth-gated: requires login before starting
 * - Session persistence: can resume in-progress assessments
 * - Server-driven: all branching/scoring happens in the LLM via tRPC
 * - Typing indicator during LLM calls (batch, not streaming)
 * - Structured score reveal after completion
 * - Artifact verification, growth plan, and share flow preserved
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Copy,
  Check,
  Upload,
  History,
  RotateCcw,
  LogIn,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ── Types ──

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

type AssessmentPhase =
  | "auth-gate"
  | "resume-prompt"
  | "interview"
  | "evaluating"
  | "results"
  | "growth-plan"
  | "growth-loading"
  | "artifact-verifying";

interface EvaluationResult {
  scores: Record<string, number> | Array<{ attribute: string; score: number; evidence: string; reasoning: string }>;
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

interface VerificationResult {
  status: "consistent" | "discrepancies" | "insufficient";
  summary: string;
  consistentClaims: string[];
  discrepancies: Array<{ claim: string; artifact: string; impact: string }>;
  scoreAdjustments: Array<{ attribute: string; originalScore: number; adjustedScore: number; reason: string }>;
}

// ── Helpers ──

const ATTRIBUTE_NAMES = [
  "Problem Framing",
  "Architecture Selection",
  "Scope Discipline",
  "Iteration Methodology",
  "Testing & Validation",
  "Documentation & Artifacts",
  "Domain Grounding",
  "Production Orientation",
];

const ATTRIBUTE_ICONS = [Target, Zap, BarChart3, Activity, Shield, FileText, Globe, Rocket];

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

function normalizeScores(scores: EvaluationResult["scores"]): Array<{ attribute: string; score: number; evidence: string; reasoning: string }> {
  if (Array.isArray(scores)) return scores;
  // If scores is a Record<string, number>, convert to array
  return Object.entries(scores).map(([attr, score]) => ({
    attribute: attr,
    score: typeof score === "number" ? score : 1,
    evidence: "",
    reasoning: "",
  }));
}

// ── Component ──

export default function ChatAssessment() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [phase, setPhase] = useState<AssessmentPhase>("auth-gate");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAttribute, setCurrentAttribute] = useState(0);

  // Results state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [growthPlan, setGrowthPlan] = useState<GrowthPlanResult | null>(null);
  const [activePhaseTab, setActivePhaseTab] = useState(0);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [artifactText, setArtifactText] = useState("");
  const [showArtifactUpload, setShowArtifactUpload] = useState(false);

  // Resume state
  const [resumeInfo, setResumeInfo] = useState<{
    sessionId: number;
    messageCount: number;
    updatedAt: Date;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const startSessionMutation = trpc.assessment.startSession.useMutation();
  const chatMutation = trpc.assessment.chat.useMutation();
  const abandonSessionMutation = trpc.assessment.abandonSession.useMutation();
  const growthPlanMutation = trpc.assessment.generateGrowthPlan.useMutation();
  const updateGrowthPlanMutation = trpc.assessment.updateGrowthPlan.useMutation();
  const verifyArtifactMutation = trpc.assessment.verifyArtifact.useMutation();

  // Check for active session
  const activeSessionQuery = trpc.assessment.getActiveSession.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // ── Auto-scroll ──
  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ── Auth gate logic ──
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setPhase("auth-gate");
      return;
    }
    // Check for active session
    if (activeSessionQuery.data) {
      setResumeInfo({
        sessionId: activeSessionQuery.data.sessionId,
        messageCount: activeSessionQuery.data.messageCount,
        updatedAt: new Date(activeSessionQuery.data.updatedAt),
      });
      setPhase("resume-prompt");
    } else if (activeSessionQuery.isSuccess && !activeSessionQuery.data) {
      // No active session — ready to start
      setPhase("interview");
      handleStartSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, activeSessionQuery.data, activeSessionQuery.isSuccess]);

  // ── Session management ──
  const handleStartSession = useCallback(() => {
    setIsTyping(true);
    startSessionMutation.mutate(undefined, {
      onSuccess: (result) => {
        setSessionId(result.sessionId);
        const msgs: ChatMessage[] = result.messages.map((m, i) => ({
          id: `msg-${i}`,
          role: m.role as "assistant" | "user",
          content: m.content,
        }));
        setMessages(msgs);
        setIsTyping(false);
        setPhase("interview");
        if (result.resumed) {
          toast.info("Resuming your previous assessment session");
        }
      },
      onError: (err) => {
        setIsTyping(false);
        toast.error(`Failed to start session: ${err.message}`);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResumeSession = () => {
    handleStartSession();
  };

  const handleNewSession = () => {
    if (resumeInfo) {
      abandonSessionMutation.mutate(
        { sessionId: resumeInfo.sessionId },
        {
          onSuccess: () => {
            setResumeInfo(null);
            handleStartSession();
          },
          onError: () => {
            // Even if abandon fails, try starting new
            setResumeInfo(null);
            handleStartSession();
          },
        }
      );
    } else {
      handleStartSession();
    }
  };

  // ── Send message ──
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || phase !== "interview" || !sessionId) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    chatMutation.mutate(
      { sessionId, message: trimmed },
      {
        onSuccess: (result) => {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: "assistant",
            content: result.content,
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          setProgress(result.progress);
          setCurrentAttribute(result.currentAttribute);

          if (result.isComplete && result.evaluation) {
            setEvaluation(result.evaluation as unknown as EvaluationResult);
            setShareToken(result.shareToken ?? null);

            // Delay transition to results for the user to read the closing message
            setTimeout(() => {
              setPhase("results");
            }, 3000);
          }
        },
        onError: (err) => {
          setIsTyping(false);
          if (err.message.includes("temporarily unavailable")) {
            toast.error("Service temporarily unavailable. Your progress has been saved — refresh to resume.");
          } else {
            toast.error(`Error: ${err.message}`);
          }
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isTyping, phase, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Growth plan ──
  const handleGenerateGrowthPlan = () => {
    if (!evaluation) return;
    setPhase("growth-loading");

    const transcript = messages
      .map((m) => `${m.role === "user" ? "User" : "Assessor"}: ${m.content}`)
      .join("\n\n");

    const evalForApi = {
      ...evaluation,
      scores: normalizeScores(evaluation.scores),
    };

    growthPlanMutation.mutate(
      { transcript, evaluation: evalForApi },
      {
        onSuccess: (result) => {
          setGrowthPlan(result as GrowthPlanResult);
          setPhase("growth-plan");
          // Save growth plan to assessment
          if (shareToken) {
            updateGrowthPlanMutation.mutate({ shareToken, growthPlan: result });
          }
        },
        onError: (err) => {
          toast.error(`Failed to generate growth plan: ${err.message}`);
          setPhase("results");
        },
      }
    );
  };

  // ── Share ──
  const handleCopyShareLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Artifact verification ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setArtifactText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleVerifyArtifact = () => {
    if (!shareToken || !artifactText.trim()) return;
    setPhase("artifact-verifying");
    verifyArtifactMutation.mutate(
      { shareToken, artifactText: artifactText.trim() },
      {
        onSuccess: (result) => {
          setVerification(result as VerificationResult);
          setShowArtifactUpload(false);
          setPhase("results");
          toast.success("Artifact verification complete");
        },
        onError: (err) => {
          setPhase("results");
          toast.error(`Verification failed: ${err.message}`);
        },
      }
    );
  };

  // ── Attribute label from progress ──
  const stageLabel =
    currentAttribute === 0
      ? "Project Grounding"
      : currentAttribute <= 8
        ? ATTRIBUTE_NAMES[currentAttribute - 1] || "Assessment"
        : "Complete";

  // ── Auth Gate View ──
  if (phase === "auth-gate" || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md px-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Sign In to Begin</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              The conversational assessment requires authentication to save your progress, persist results, and generate personalized growth plans. Your session is saved automatically so you can resume anytime.
            </p>
            <Button
              size="lg"
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display px-8 h-12"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Start
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Your assessment data is private and only shared when you explicitly create a share link.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Resume Prompt View ──
  if (phase === "resume-prompt" && resumeInfo) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md px-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Resume Assessment?</h2>
            <p className="text-muted-foreground mb-2 leading-relaxed">
              You have an in-progress assessment with {resumeInfo.messageCount} messages.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Last active: {resumeInfo.updatedAt.toLocaleString()}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                onClick={handleResumeSession}
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display h-12"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resume Where I Left Off
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleNewSession}
                className="h-12"
              >
                Start Fresh
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Growth Plan View ──
  if (phase === "growth-plan" && growthPlan) {
    const currentPhaseData = growthPlan.phases[activePhaseTab];
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setPhase("results")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-display text-lg font-bold leading-tight">Your Growth Plan</h1>
                <p className="text-xs text-muted-foreground">
                  {growthPlan.currentTier} → {growthPlan.targetTier}
                </p>
              </div>
            </div>
            {shareToken && (
              <Button variant="outline" size="sm" onClick={handleCopyShareLink} className="gap-1.5">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Share"}
              </Button>
            )}
          </div>
        </header>

        <div className="container max-w-3xl py-8">
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
          {currentPhaseData && (
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
                    {currentPhaseData.objectives.map((obj, i) => (
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
                    Project: {currentPhaseData.project.title}
                  </h3>
                  <p className="text-sm text-card-foreground/80 mb-4">{currentPhaseData.project.description}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">Deliverables</h4>
                      <ul className="space-y-1">
                        {currentPhaseData.project.deliverables.map((d, i) => (
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
                        {currentPhaseData.project.successCriteria.map((c, i) => (
                          <li key={i} className="text-sm text-card-foreground/80 flex items-start gap-2">
                            <Shield className="w-3.5 h-3.5 text-amber-400/50 mt-0.5 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Step-by-Step Instructions
                  </h3>
                  <ol className="space-y-3">
                    {currentPhaseData.instructions.map((inst, i) => (
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

          {/* Phase Navigation */}
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

  // ── Growth Loading View ──
  if (phase === "growth-loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container flex items-center gap-3 h-14">
            <Button variant="ghost" size="icon" onClick={() => setPhase("results")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold">Generating Growth Plan</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Building Your Growth Plan</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Creating a personalized 30-60-90 day roadmap with projects tailored to your specific gaps...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Results View ──
  if ((phase === "results" || phase === "artifact-verifying") && evaluation) {
    const scores = normalizeScores(evaluation.scores);
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Activity className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold">Assessment Results</span>
            </div>
            <div className="flex items-center gap-2">
              {shareToken && (
                <Button variant="outline" size="sm" onClick={handleCopyShareLink} className="gap-1.5">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Share"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="gap-1.5">
                <History className="w-4 h-4" />
                History
              </Button>
            </div>
          </div>
        </header>

        <div className="container max-w-3xl py-8">
          {/* Tier Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`rounded-xl border p-8 text-center mb-8 ${getTierBg(evaluation.compositeTier)}`}
          >
            <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-2">Your Maturity Tier</p>
            <h2 className={`font-display text-5xl font-bold mb-2 ${getTierColor(evaluation.compositeTier)}`}>
              {evaluation.compositeTier}
            </h2>
            <p className="font-mono text-2xl text-foreground/80 mb-4">
              {evaluation.compositeScore}<span className="text-muted-foreground">/32</span>
            </p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {evaluation.narrative}
            </p>
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
              {scores.map((score, i) => {
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
                    {(score.evidence || score.reasoning) && (
                      <details className="group">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                          View evidence & reasoning
                        </summary>
                        <div className="mt-2 pl-6 border-l border-border space-y-1">
                          {score.evidence && (
                            <p className="text-xs text-foreground/70">
                              <span className="font-semibold text-foreground/90">Evidence:</span> {score.evidence}
                            </p>
                          )}
                          {score.reasoning && (
                            <p className="text-xs text-foreground/70">
                              <span className="font-semibold text-foreground/90">Reasoning:</span> {score.reasoning}
                            </p>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Verification Results */}
          {verification && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl border border-border bg-card p-6 mb-8"
            >
              <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Artifact Verification
              </h3>
              <p className="text-sm text-card-foreground/80 mb-4">{verification.summary}</p>
              {verification.consistentClaims.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-emerald-400/70 uppercase tracking-wider mb-2">Confirmed Claims</h4>
                  <ul className="space-y-1">
                    {verification.consistentClaims.map((c, i) => (
                      <li key={i} className="text-sm text-card-foreground/70 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/50 mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {verification.discrepancies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-amber-400/70 uppercase tracking-wider mb-2">Discrepancies</h4>
                  <div className="space-y-3">
                    {verification.discrepancies.map((d, i) => (
                      <div key={i} className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                        <p className="text-xs text-card-foreground/80"><span className="font-semibold">Claimed:</span> {d.claim}</p>
                        <p className="text-xs text-card-foreground/80 mt-1"><span className="font-semibold">Artifact shows:</span> {d.artifact}</p>
                        <p className="text-xs text-amber-400/80 mt-1">{d.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {verification.scoreAdjustments.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">Score Adjustments</h4>
                  <div className="space-y-2">
                    {verification.scoreAdjustments.map((adj, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-card-foreground">{adj.attribute}:</span>
                        <span className={getScoreColor(adj.originalScore)}>{adj.originalScore}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className={getScoreColor(adj.adjustedScore)}>{adj.adjustedScore}</span>
                        <span className="text-xs text-muted-foreground ml-1">({adj.reason})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Artifact Upload */}
          {shareToken && !verification && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded-xl border border-dashed border-border bg-card/50 p-6 mb-8"
            >
              {!showArtifactUpload ? (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-display font-semibold mb-1">Verify with Project Artifacts</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Upload your README, design doc, or other project documentation to cross-reference your interview claims.
                  </p>
                  <Button variant="outline" onClick={() => setShowArtifactUpload(true)}>
                    Upload Artifact
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload Project Artifact
                  </h3>
                  <div className="space-y-3">
                    <Textarea
                      value={artifactText}
                      onChange={(e) => setArtifactText(e.target.value)}
                      placeholder="Paste your README.md, design doc, or project documentation here..."
                      className="min-h-[200px] bg-background"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <input ref={fileInputRef} type="file" accept=".md,.txt,.rst,.html" onChange={handleFileUpload} className="hidden" />
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <FileText className="w-4 h-4 mr-1" />
                          Upload file
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setShowArtifactUpload(false); setArtifactText(""); }}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleVerifyArtifact}
                          disabled={!artifactText.trim() || verifyArtifactMutation.isPending}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {verifyArtifactMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Shield className="w-4 h-4 mr-1" />}
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-3"
          >
            <Button
              size="lg"
              onClick={handleGenerateGrowthPlan}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display text-base px-8 h-12"
            >
              Generate My 30-60-90 Day Growth Plan
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Personalized to your {evaluation.compositeTier} tier with projects targeting your specific gaps.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Evaluating View ──
  if (phase === "evaluating") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
              Scoring your interview against the rubric across all 8 attributes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Interview (Chat) View ──
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
            <span className="text-xs text-muted-foreground ml-2 font-mono">{stageLabel}</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{Math.round(progress * 100)}%</span>
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
            {messages.map((msg) => (
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

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
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
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-end">
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
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
