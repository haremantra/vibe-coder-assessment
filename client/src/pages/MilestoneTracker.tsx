/**
 * MilestoneTracker — Phase-gated growth plan progress tracking
 * Shows milestones per phase, locks future phases until current is complete,
 * fires notifications on phase/plan completion.
 */

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  Trophy,
  Sparkles,
  History as HistoryIcon,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const phaseLabels = ["0-30 Days", "30-60 Days", "60-90 Days"];
const phaseDescriptions = [
  "Foundation building — establish core habits and frameworks",
  "Skill deepening — apply patterns to increasingly complex problems",
  "Mastery demonstration — lead, teach, and systematize your approach",
];

export default function MilestoneTracker() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const assessmentId = Number(params.get("id"));

  // Fetch assessment data
  const { data: assessments = [] } = trpc.assessment.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const assessment = useMemo(
    () => assessments.find((a: any) => a.id === assessmentId),
    [assessments, assessmentId],
  );

  // Fetch milestones
  const {
    data: milestones = [],
    refetch: refetchMilestones,
  } = trpc.milestone.getByAssessment.useQuery(
    { assessmentId },
    { enabled: isAuthenticated && !!assessmentId },
  );

  // Fetch phase status
  const {
    data: phaseStatuses,
    refetch: refetchPhaseStatus,
  } = trpc.milestone.phaseStatus.useQuery(
    { assessmentId },
    { enabled: isAuthenticated && !!assessmentId },
  );

  // Init milestones mutation
  const initMilestones = trpc.milestone.init.useMutation({
    onSuccess: () => {
      refetchMilestones();
      refetchPhaseStatus();
    },
  });

  // Toggle milestone mutation
  const toggleMilestone = trpc.milestone.toggle.useMutation({
    onSuccess: () => {
      refetchMilestones();
      refetchPhaseStatus();
    },
  });

  const utils = trpc.useUtils();

  // Initialize milestones from growth plan if not yet done
  useEffect(() => {
    if (
      assessment?.growthPlanJson &&
      milestones.length === 0 &&
      !initMilestones.isPending &&
      !initMilestones.isSuccess
    ) {
      const plan = assessment.growthPlanJson as any;
      const phases = plan.phases || [];
      const milestoneData: { phaseIndex: number; milestoneIndex: number; milestoneText: string }[] = [];

      phases.forEach((phase: any, phaseIdx: number) => {
        // Add deliverables as milestones
        const deliverables = phase.deliverables || [];
        deliverables.forEach((d: string, mIdx: number) => {
          milestoneData.push({
            phaseIndex: phaseIdx,
            milestoneIndex: mIdx,
            milestoneText: d,
          });
        });

        // Add success criteria as milestones
        const criteria = phase.successCriteria || [];
        criteria.forEach((c: string, cIdx: number) => {
          milestoneData.push({
            phaseIndex: phaseIdx,
            milestoneIndex: deliverables.length + cIdx,
            milestoneText: `✓ ${c}`,
          });
        });
      });

      if (milestoneData.length > 0) {
        initMilestones.mutate({ assessmentId, milestones: milestoneData });
      }
    }
  }, [assessment, milestones.length, assessmentId]);

  // Group milestones by phase
  const milestonesByPhase = useMemo(() => {
    const grouped: Record<number, typeof milestones> = { 0: [], 1: [], 2: [] };
    milestones.forEach((m: any) => {
      if (!grouped[m.phaseIndex]) grouped[m.phaseIndex] = [];
      grouped[m.phaseIndex].push(m);
    });
    return grouped;
  }, [milestones]);

  // Determine which phases are unlocked
  const phaseUnlocked = useMemo(() => {
    if (!phaseStatuses) return [true, false, false];
    return [
      true, // Phase 0 always unlocked
      phaseStatuses[0]?.total > 0 && phaseStatuses[0]?.completed === phaseStatuses[0]?.total,
      phaseStatuses[1]?.total > 0 && phaseStatuses[1]?.completed === phaseStatuses[1]?.total,
    ];
  }, [phaseStatuses]);

  // Overall progress
  const overallProgress = useMemo(() => {
    if (!phaseStatuses) return 0;
    const total = phaseStatuses.reduce((s: number, p: any) => s + (p?.total || 0), 0);
    const completed = phaseStatuses.reduce((s: number, p: any) => s + (p?.completed || 0), 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [phaseStatuses]);

  const allComplete = overallProgress === 100 && milestones.length > 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Sign in to track your growth plan progress.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!assessmentId || !assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">No Assessment Found</h2>
          <p className="text-muted-foreground mb-6">
            Complete an assessment first to track your growth plan.
          </p>
          <Button onClick={() => navigate("/chat-assess")}>Take Assessment</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="font-display text-sm font-bold tracking-tight text-foreground flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-primary" />
            Vibe Coder Assessment
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/history")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <HistoryIcon className="w-5 h-5 text-muted-foreground" />
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="container pt-20 pb-16 max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/history")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>

        {/* Title + Overall Progress */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold mb-2">Growth Plan Tracker</h1>
          <p className="text-muted-foreground mb-1">
            {assessment.compositeTier} Tier — Score {assessment.compositeScore}/32
          </p>

          {/* Overall progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground font-mono">Overall Progress</span>
              <span className="font-mono font-bold text-primary">{overallProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {allComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="font-display font-bold text-amber-400">Plan Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    You've completed all milestones. Time to{" "}
                    <button
                      onClick={() => navigate("/chat-assess")}
                      className="text-primary hover:underline"
                    >
                      reassess your maturity
                    </button>{" "}
                    and see how you've grown.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Three-segment phase indicator */}
        <div className="flex gap-2 mb-10">
          {[0, 1, 2].map((pi) => {
            const status = phaseStatuses?.[pi];
            const pct =
              status && status.total > 0
                ? Math.round((status.completed / status.total) * 100)
                : 0;
            const isComplete = pct === 100 && (status?.total || 0) > 0;
            const unlocked = phaseUnlocked[pi];

            return (
              <div key={pi} className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span
                    className={`font-mono ${
                      unlocked ? "text-foreground" : "text-muted-foreground/50"
                    }`}
                  >
                    {phaseLabels[pi]}
                  </span>
                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {!unlocked && <Lock className="w-3 h-3 text-muted-foreground/30" />}
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete
                        ? "bg-emerald-400"
                        : unlocked
                          ? "bg-primary"
                          : "bg-muted-foreground/20"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase Cards */}
        {[0, 1, 2].map((phaseIdx) => {
          const unlocked = phaseUnlocked[phaseIdx];
          const phaseMilestones = milestonesByPhase[phaseIdx] || [];
          const status = phaseStatuses?.[phaseIdx];
          const isComplete =
            status && status.total > 0 && status.completed === status.total;

          return (
            <motion.div
              key={phaseIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIdx * 0.1 }}
              className={`mb-8 rounded-xl border ${
                isComplete
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : unlocked
                    ? "border-border bg-card/50"
                    : "border-border/30 bg-card/20 opacity-60"
              } overflow-hidden`}
            >
              {/* Phase Header */}
              <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : unlocked ? (
                    <Sparkles className="w-5 h-5 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground/40" />
                  )}
                  <div>
                    <h3 className="font-display font-bold text-foreground">
                      {phaseLabels[phaseIdx]}
                    </h3>
                    <p className="text-xs text-muted-foreground">{phaseDescriptions[phaseIdx]}</p>
                  </div>
                </div>
                {status && status.total > 0 && (
                  <span className="font-mono text-sm text-muted-foreground">
                    {status.completed}/{status.total}
                  </span>
                )}
              </div>

              {/* Milestones */}
              <div className="px-6 py-3">
                {!unlocked && phaseIdx > 0 ? (
                  <div className="py-6 text-center">
                    <Lock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Complete the {phaseLabels[phaseIdx - 1]} phase to unlock
                    </p>
                  </div>
                ) : phaseMilestones.length === 0 ? (
                  <div className="py-6 text-center">
                    <Activity className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Loading milestones...</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/20">
                    {phaseMilestones.map((m: any) => (
                      <li key={m.id} className="py-3">
                        <button
                          onClick={() => {
                            if (!unlocked) return;
                            toggleMilestone.mutate({
                              milestoneId: m.id,
                              completed: !m.completed,
                              assessmentId,
                              phaseIndex: phaseIdx,
                            });
                            // Invalidate notification count after toggle
                            setTimeout(() => {
                              utils.notification.unreadCount.invalidate();
                              utils.notification.list.invalidate();
                            }, 500);
                          }}
                          disabled={!unlocked || toggleMilestone.isPending}
                          className={`w-full flex items-start gap-3 text-left group ${
                            !unlocked ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {m.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle
                                className={`w-5 h-5 ${
                                  unlocked
                                    ? "text-muted-foreground/40 group-hover:text-primary transition-colors"
                                    : "text-muted-foreground/20"
                                }`}
                              />
                            )}
                          </div>
                          <span
                            className={`text-sm leading-relaxed ${
                              m.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {m.milestoneText}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          );
        })}
      </main>
    </div>
  );
}
