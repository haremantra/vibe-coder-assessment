/**
 * SharedResults — Public read-only view of an assessment via share token
 * Accessible at /share/:token without authentication
 */

import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import {
  Loader2,
  Activity,
  ArrowLeft,
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
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";

const ATTRIBUTE_ICONS = [Target, Zap, BarChart3, Activity, Shield, FileText, Globe, Rocket];

function getTierColor(tier: string): string {
  switch (tier) {
    case "Novice": return "text-red-400";
    case "Practitioner": return "text-amber-400";
    case "Senior": return "text-cyan-400";
    case "Principal": return "text-emerald-400";
    default: return "text-foreground";
  }
}

function getTierBg(tier: string): string {
  switch (tier) {
    case "Novice": return "border-red-400/20 bg-red-400/5";
    case "Practitioner": return "border-amber-400/20 bg-amber-400/5";
    case "Senior": return "border-cyan-400/20 bg-cyan-400/5";
    case "Principal": return "border-emerald-400/20 bg-emerald-400/5";
    default: return "border-border bg-card";
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

function getVerificationBadge(status: string) {
  switch (status) {
    case "consistent":
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          Artifact Verified
        </div>
      );
    case "discrepancies":
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs font-mono">
          <ShieldAlert className="w-3.5 h-3.5" />
          Discrepancies Found
        </div>
      );
    case "insufficient":
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-muted-foreground/30 bg-muted/10 text-muted-foreground text-xs font-mono">
          <ShieldQuestion className="w-3.5 h-3.5" />
          Insufficient Artifact
        </div>
      );
    default:
      return null;
  }
}

export default function SharedResults() {
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();

  const { data: assessment, isLoading, error } = trpc.assessment.getByShareToken.useQuery(
    { token: params.token ?? "" },
    { enabled: Boolean(params.token), retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Assessment Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">This share link may have expired or is invalid.</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold">Shared Assessment</h1>
              <p className="text-sm text-muted-foreground">
                {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
              </p>
            </div>
          </div>
          {assessment.artifactVerified !== "none" && getVerificationBadge(assessment.artifactVerified)}
        </div>

        {/* Tier Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl border p-8 mb-8 text-center ${getTierBg(assessment.compositeTier)}`}
        >
          <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wider">Composite Maturity Tier</p>
          <h2 className={`font-display text-5xl font-bold mb-2 ${getTierColor(assessment.compositeTier)}`}>
            {assessment.compositeTier}
          </h2>
          <p className="font-mono text-2xl text-foreground/80">
            {assessment.compositeScore} <span className="text-muted-foreground text-lg">/ 32</span>
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
            <Streamdown>{assessment.narrative}</Streamdown>
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
              {assessment.topStrengths.map((s: string, i: number) => (
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
              {assessment.criticalGaps.map((g: string, i: number) => (
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
            {assessment.scores.map((score: { attribute: string; score: number; evidence: string; reasoning: string }, i: number) => {
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

        {/* Verification Details */}
        {assessment.artifactVerified !== "none" && assessment.verificationDetails && (() => {
          try {
            const details = JSON.parse(assessment.verificationDetails);
            return (
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
                <p className="text-sm text-card-foreground/80 mb-4">{details.summary}</p>
                {details.scoreAdjustments && details.scoreAdjustments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono text-primary/70 uppercase tracking-wider">Score Adjustments</h4>
                    {details.scoreAdjustments.map((adj: { attribute: string; originalScore: number; adjustedScore: number; reason: string }, i: number) => (
                      <div key={i} className="text-sm text-card-foreground/80 flex items-center gap-2">
                        <span className="font-medium">{adj.attribute}:</span>
                        <span className={getScoreColor(adj.originalScore)}>{adj.originalScore}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className={getScoreColor(adj.adjustedScore)}>{adj.adjustedScore}</span>
                        <span className="text-xs text-muted-foreground">({adj.reason})</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          } catch {
            return null;
          }
        })()}

        {/* CTA to take own assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center py-8"
        >
          <p className="text-sm text-muted-foreground mb-4">Want to assess your own vibe coding maturity?</p>
          <Button
            size="lg"
            onClick={() => navigate("/chat-assess")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display"
          >
            Take the Assessment
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
