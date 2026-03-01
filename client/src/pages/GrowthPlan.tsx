/*
 * Signal / Noise — Growth Plan Page
 * Design: Timeline-based 30-60-90 day plan with project cards
 * Dark navy, phase-gated timeline, instrument panel cards
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  CheckSquare,
  BookOpen,
  ArrowUpRight,
  AlertCircle,
  Rocket,
  Layers,
  Zap,
} from "lucide-react";
import { getTierFromScore, GROWTH_PLANS } from "@/lib/rubricData";
import { useAssessmentStore } from "@/hooks/useAssessmentStore";

const BADGE_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663361461713/98UuH5CAArJboW7zFiG9Jf/tier-badge-bg-5QVXrxFkRS8XbhMn35J7jb.webp";

const phaseIcons = [Rocket, Layers, Zap];
const phaseColors = [
  { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
  { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
  { bg: "bg-chart-5/10", text: "text-chart-5", border: "border-chart-5/30" },
];

export default function GrowthPlan() {
  const [, navigate] = useLocation();
  const { scores, totalScore, isComplete } = useAssessmentStore();
  const [activePhase, setActivePhase] = useState(0);

  const tier = useMemo(() => getTierFromScore(totalScore), [totalScore]);
  const plan = useMemo(() => GROWTH_PLANS[tier.label], [tier.label]);

  if (!isComplete || !plan) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">No Assessment Data</h1>
          <p className="text-muted-foreground mb-6">
            Complete the self-assessment first to get your personalized growth plan.
          </p>
          <Button onClick={() => navigate("/assess")} className="font-display">
            Start Assessment
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  const currentPhase = plan.phases[activePhase];
  const PhaseIcon = phaseIcons[activePhase];
  const colors = phaseColors[activePhase];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/results")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-display">Results</span>
          </button>
          <span className="font-display text-sm font-semibold text-foreground">
            Growth Plan
          </span>
          <button
            onClick={() => navigate("/")}
            className="font-display text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Home
          </button>
        </div>
      </header>

      {/* Plan header */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <img src={BADGE_BG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono tracking-wider text-primary uppercase">
                90-Day Growth Plan
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
              {tier.label} → Next Level
            </h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              {plan.primaryFocus}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Phase selector tabs */}
      <section className="border-b border-border/50 bg-card/20">
        <div className="container">
          <div className="flex gap-0">
            {plan.phases.map((phase, i) => {
              const isActive = i === activePhase;
              const Icon = phaseIcons[i];
              return (
                <button
                  key={phase.phase}
                  onClick={() => setActivePhase(i)}
                  className={`relative flex items-center gap-2 px-5 py-4 text-sm font-display font-medium transition-all border-b-2 ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">Days</span> {phase.phase}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Phase content */}
      <main className="py-12">
        <div className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Phase header */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <PhaseIcon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {currentPhase.label}
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground">
                      Days {currentPhase.phase}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl leading-relaxed">
                  {currentPhase.focus}
                </p>
              </div>

              {/* Project cards */}
              <div className="space-y-6">
                {currentPhase.projects.map((project, pi) => (
                  <motion.div
                    key={pi}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: pi * 0.15 }}
                    className={`instrument-border rounded-xl bg-card/50 overflow-hidden`}
                  >
                    {/* Project header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-md ${colors.bg} flex items-center justify-center font-mono text-sm font-bold ${colors.text}`}>
                            {pi + 1}
                          </span>
                          <h3 className="font-display text-lg font-bold text-card-foreground">
                            {project.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Deliverables */}
                    <div className="px-6 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-mono text-primary uppercase tracking-wider">
                          Deliverables
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {project.deliverables.map((d, di) => (
                          <li key={di} className="flex items-start gap-2.5 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                            <span className="text-muted-foreground">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Skills targeted */}
                    <div className="px-6 pb-5 pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-mono text-accent uppercase tracking-wider">
                          Skills Targeted
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-xs font-mono text-muted-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Phase navigation */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setActivePhase((p) => Math.max(0, p - 1))}
                  disabled={activePhase === 0}
                  className="font-display"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous Phase
                </Button>

                {activePhase < 2 ? (
                  <Button
                    variant="outline"
                    onClick={() => setActivePhase((p) => Math.min(2, p + 1))}
                    className="font-display"
                  >
                    Next Phase
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/results")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-display"
                  >
                    Back to Results
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Reassessment cadence */}
      <section className="py-12 bg-card/30 border-t border-border/50">
        <div className="container max-w-2xl text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">Reassessment Cadence</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Reassess every 10-15 completed projects, or every 6 months. Your score
            should not increase monotonically — as you take on harder problems, you
            may temporarily score lower on some attributes. This is expected and
            healthy.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigate("/");
            }}
            className="font-display"
          >
            Return to Home
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-mono">
            Vibe Coder Self-Assessment Rubric: Option A, 2026
          </span>
          <span>Free to use, adapt, and share with attribution.</span>
        </div>
      </footer>
    </div>
  );
}
