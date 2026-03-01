/**
 * History — Assessment history page showing all past assessments
 * Links to MilestoneTracker, CompareOverTime, and SharedResults
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import {
  Loader2,
  Activity,
  ArrowLeft,
  Clock,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  ListChecks,
  BarChart3,
  History as HistoryIcon,
  Download,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

function getVerificationIcon(status: string) {
  switch (status) {
    case "consistent":
      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    case "discrepancies":
      return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    case "insufficient":
      return <ShieldQuestion className="w-4 h-4 text-muted-foreground" />;
    default:
      return null;
  }
}

function generateSummaryMarkdown(assessment: any): string {
  const scores = (assessment.scoresJson as any[]) || [];
  const date = new Date(assessment.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let md = `# Vibe Coder Assessment Summary\n\n`;
  md += `**Date:** ${date}\n`;
  md += `**Composite Score:** ${assessment.compositeScore}/32\n`;
  md += `**Maturity Tier:** ${assessment.compositeTier}\n\n`;
  md += `---\n\n`;
  md += `## Attribute Scores\n\n`;
  md += `| Attribute | Score | Tier |\n`;
  md += `|-----------|-------|------|\n`;

  const tierLabel = (s: number) => {
    if (s <= 1) return "Novice";
    if (s <= 2) return "Practitioner";
    if (s <= 3) return "Senior";
    return "Principal";
  };

  scores.forEach((s: any) => {
    md += `| ${s.attribute} | ${s.score}/4 | ${tierLabel(s.score)} |\n`;
  });

  md += `\n---\n\n`;
  md += `## Evidence & Reasoning\n\n`;
  scores.forEach((s: any) => {
    md += `### ${s.attribute} (${s.score}/4)\n\n`;
    md += `**Evidence:** ${s.evidence}\n\n`;
    md += `**Reasoning:** ${s.reasoning}\n\n`;
  });

  if (assessment.growthPlanJson) {
    const plan = assessment.growthPlanJson as any;
    md += `---\n\n## Growth Plan\n\n`;
    const phases = plan.phases || [];
    phases.forEach((p: any, i: number) => {
      const labels = ["0-30 Days", "30-60 Days", "60-90 Days"];
      md += `### ${labels[i]}: ${p.title}\n\n`;
      md += `${p.description}\n\n`;
      md += `**Deliverables:**\n`;
      (p.deliverables || []).forEach((d: string) => {
        md += `- [ ] ${d}\n`;
      });
      md += `\n**Success Criteria:**\n`;
      (p.successCriteria || []).forEach((c: string) => {
        md += `- ${c}\n`;
      });
      md += `\n`;
    });
  }

  md += `---\n\n`;
  md += `*Share link: ${window.location.origin}/share/${assessment.shareToken}*\n`;

  return md;
}

function downloadSummary(assessment: any) {
  const md = generateSummaryMarkdown(assessment);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vibe-coder-assessment-${assessment.compositeTier.toLowerCase()}-${new Date(assessment.createdAt).toISOString().split("T")[0]}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Summary downloaded");
}

export default function History() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: assessments, isLoading } = trpc.assessment.history.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const handleCopyShareLink = (shareToken: string) => {
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(shareToken);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to view your assessment history.</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>
            Sign In
          </Button>
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
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="container max-w-4xl pt-20 pb-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold">Assessment History</h1>
              <p className="text-sm text-muted-foreground">
                {user?.name ? `${user.name}'s` : "Your"} past assessments
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          {assessments && assessments.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/compare")}
              className="hidden sm:flex"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Compare Over Time
            </Button>
          )}
        </div>

        {/* Compare Over Time banner (mobile + when 2+ assessments) */}
        {assessments && assessments.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 cursor-pointer hover:border-primary/40 transition-colors sm:hidden"
            onClick={() => navigate("/compare")}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Compare Over Time</p>
                <p className="text-xs text-muted-foreground">
                  See how your scores have changed across {assessments.length} assessments
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !assessments || assessments.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold mb-2">No Assessments Yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Take your first assessment to see results here.</p>
            <Button onClick={() => navigate("/chat-assess")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Start Assessment
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((a: any, i: number) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-5 ${getTierBg(a.compositeTier)} hover:border-primary/30 transition-all`}
              >
                {/* Main row — clickable to view results */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => navigate(`/share/${a.shareToken}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={`font-display text-2xl font-bold ${getTierColor(a.compositeTier)}`}>
                        {a.compositeScore}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">/32</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-display font-semibold ${getTierColor(a.compositeTier)}`}>
                          {a.compositeTier}
                        </h3>
                        {getVerificationIcon(a.artifactVerified)}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(a.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>

                {/* Action buttons row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                  {a.growthPlanJson && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/milestones?id=${a.id}`);
                      }}
                    >
                      <ListChecks className="w-3.5 h-3.5 mr-1" />
                      Track Progress
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyShareLink(a.shareToken);
                    }}
                  >
                    {copiedToken === a.shareToken ? (
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSummary(a);
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Take new assessment CTA */}
        {assessments && assessments.length > 0 && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => navigate("/chat-assess")}
            >
              Take New Assessment
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
