/**
 * History — Assessment history page showing all past assessments
 * Protected route — requires authentication
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
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
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
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
            {assessments.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-5 ${getTierBg(a.compositeTier)} hover:border-primary/30 transition-all cursor-pointer`}
                onClick={() => navigate(`/share/${a.shareToken}`)}
              >
                <div className="flex items-center justify-between">
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyShareLink(a.shareToken);
                      }}
                    >
                      {copiedToken === a.shareToken ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
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
