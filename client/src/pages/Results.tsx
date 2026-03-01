/*
 * Signal / Noise — Results Page
 * Design: Dashboard readout panels, radar chart, tier reveal
 * Dark navy, cyan data visualization, amber highlights
 */

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronRight,
  RotateCcw,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ATTRIBUTES, getTierFromScore, TIER_META } from "@/lib/rubricData";
import { useAssessmentStore } from "@/hooks/useAssessmentStore";

const RESULTS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663361461713/98UuH5CAArJboW7zFiG9Jf/results-bg-6uQohupFnyybAR9ZHGCEfi.webp";

const tierColors: Record<string, string> = {
  Novice: "oklch(0.65 0.2 25)",
  Practitioner: "oklch(0.8 0.16 75)",
  Senior: "oklch(0.75 0.15 195)",
  Principal: "oklch(0.7 0.18 150)",
};

export default function Results() {
  const [, navigate] = useLocation();
  const { scores, totalScore, isComplete, resetAssessment } = useAssessmentStore();

  const tier = useMemo(() => getTierFromScore(totalScore), [totalScore]);

  const radarData = useMemo(
    () =>
      ATTRIBUTES.map((attr) => ({
        attribute: attr.name.length > 14 ? attr.name.slice(0, 12) + "…" : attr.name,
        fullName: attr.name,
        score: scores[attr.id] || 0,
        fullMark: 4,
      })),
    [scores]
  );

  const weakest = useMemo(() => {
    let min = 5;
    let weakAttr = ATTRIBUTES[0];
    ATTRIBUTES.forEach((a) => {
      const s = scores[a.id] || 0;
      if (s < min) {
        min = s;
        weakAttr = a;
      }
    });
    return weakAttr;
  }, [scores]);

  const strongest = useMemo(() => {
    let max = 0;
    let strongAttr = ATTRIBUTES[0];
    ATTRIBUTES.forEach((a) => {
      const s = scores[a.id] || 0;
      if (s > max) {
        max = s;
        strongAttr = a;
      }
    });
    return strongAttr;
  }, [scores]);

  if (!isComplete) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Assessment Incomplete</h1>
          <p className="text-muted-foreground mb-6">
            You need to score all 8 attributes before viewing results.
          </p>
          <Button onClick={() => navigate("/assess")} className="font-display">
            Continue Assessment
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero tier reveal */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={RESULTS_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>

        <div className="relative z-10 container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono tracking-wider text-primary uppercase">
                Calibration Complete
              </span>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-6"
            >
              <span className="font-mono text-7xl sm:text-8xl font-bold text-primary glow-text-cyan">
                {totalScore}
              </span>
              <span className="font-mono text-2xl text-muted-foreground">/32</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">
                {tier.label}
              </h1>
              <p className="text-sm font-mono text-muted-foreground mb-4">
                {tier.percentile} percentile · {tier.equivalent}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {tier.profile}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Radar chart + attribute breakdown */}
      <section className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12">
            {/* Radar */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-2xl font-bold mb-6">Signal Profile</h2>
              <div className="instrument-border rounded-lg bg-card/50 p-6">
                <ResponsiveContainer width="100%" height={380}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="oklch(0.28 0.02 260)" />
                    <PolarAngleAxis
                      dataKey="attribute"
                      tick={{ fill: "oklch(0.6 0.02 250)", fontSize: 11, fontFamily: "'DM Sans'" }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 4]}
                      tick={{ fill: "oklch(0.4 0.02 250)", fontSize: 10, fontFamily: "'JetBrains Mono'" }}
                      tickCount={5}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="oklch(0.75 0.15 195)"
                      fill="oklch(0.75 0.15 195)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Attribute breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-2xl font-bold mb-6">Attribute Readout</h2>
              <div className="space-y-3">
                {ATTRIBUTES.map((attr) => {
                  const score = scores[attr.id] || 0;
                  const tierLabel = attr.tiers[score - 1]?.label || "—";
                  const gapToNext = score < 4 ? 4 - score : 0;
                  return (
                    <div
                      key={attr.id}
                      className="instrument-border rounded-lg bg-card/50 p-4 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-mono text-sm font-bold text-primary">
                          {score}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display text-sm font-semibold text-card-foreground truncate">
                            {attr.name}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">
                            {tierLabel}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: "oklch(0.75 0.15 195)" }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(score / 4) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                          />
                        </div>
                      </div>
                      {gapToNext > 0 && (
                        <span className="text-xs font-mono text-muted-foreground/60 shrink-0">
                          +{gapToNext} to max
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="py-16 bg-card/30">
        <div className="container">
          <h2 className="font-display text-2xl font-bold mb-8">Diagnostic Insights</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="instrument-border rounded-lg p-6 bg-card/50"
            >
              <TrendingUp className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-display font-semibold text-sm text-card-foreground mb-1">
                Strongest Signal
              </h3>
              <p className="font-display text-lg font-bold text-primary mb-1">
                {strongest.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Score: {scores[strongest.id]}/4 — Leverage this strength to compensate for weaker areas.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="instrument-border rounded-lg p-6 bg-card/50"
            >
              <AlertCircle className="w-5 h-5 text-accent mb-3" />
              <h3 className="font-display font-semibold text-sm text-card-foreground mb-1">
                Growth Edge
              </h3>
              <p className="font-display text-lg font-bold text-accent mb-1">
                {weakest.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Score: {scores[weakest.id]}/4 — Immediate growth opportunity. Focus here first.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="instrument-border rounded-lg p-6 bg-card/50"
            >
              <ArrowUpRight className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-display font-semibold text-sm text-card-foreground mb-1">
                Key Growth Edge
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tier.growthEdge}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interpretation guide */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl font-bold mb-6">Score Interpretation</h2>
          <div className="instrument-border rounded-lg bg-card/50 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto] text-xs font-mono text-muted-foreground border-b border-border/50 px-5 py-3">
              <span>Score</span>
              <span className="pl-4">Meaning</span>
              <span>Action</span>
            </div>
            {[
              { range: "1-2", meaning: "Immediate growth opportunities", action: "Focus here first" },
              { range: "3", meaning: "You're competent", action: "Push to 4 if career-critical" },
              { range: "4", meaning: "Your strengths", action: "Leverage to compensate" },
            ].map((row) => (
              <div
                key={row.range}
                className="grid grid-cols-[auto_1fr_auto] text-sm px-5 py-3 border-b border-border/30 last:border-0"
              >
                <span className="font-mono text-primary font-semibold w-12">{row.range}</span>
                <span className="text-card-foreground pl-4">{row.meaning}</span>
                <span className="text-muted-foreground">{row.action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card/30">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Your 30-60-90 Day Growth Plan
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Based on your {tier.label} tier assessment, we've prepared a personalized
            growth plan with concrete projects for each 30-day phase.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/growth-plan")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display text-base px-8 h-12"
            >
              View Growth Plan
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                resetAssessment();
                navigate("/assess");
              }}
              className="font-display text-base px-8 h-12"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Assessment
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-mono">
            Vibe Coder Self-Assessment Rubric: Option A, 2026
          </span>
          <span>Reassess every 10-15 projects or every 6 months.</span>
        </div>
      </footer>
    </div>
  );
}
