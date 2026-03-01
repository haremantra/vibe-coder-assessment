/**
 * CompareOverTime — Small Multiples Timeline
 * One sparkline per attribute showing score trend across assessments.
 * Build order: Feature 1 (last) — reads from existing assessment history.
 */

import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import {
  Activity,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  History as HistoryIcon,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const ATTRIBUTES = [
  "Problem Framing",
  "Architecture Selection",
  "Scope Discipline",
  "Iteration Methodology",
  "Testing & Validation",
  "Documentation & Artifacts",
  "Domain Grounding",
  "Production Orientation",
];

const ATTRIBUTE_COLORS = [
  "oklch(0.75 0.18 195)",  // cyan
  "oklch(0.75 0.18 155)",  // emerald
  "oklch(0.75 0.18 275)",  // violet
  "oklch(0.75 0.18 55)",   // amber
  "oklch(0.75 0.18 330)",  // pink
  "oklch(0.75 0.18 225)",  // blue
  "oklch(0.75 0.18 105)",  // lime
  "oklch(0.75 0.18 25)",   // orange
];

export default function CompareOverTime() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: assessments = [] } = trpc.assessment.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Parse assessments into timeline data (oldest first)
  const timelineData = useMemo(() => {
    if (assessments.length === 0) return [];

    // Reverse to get chronological order (oldest first)
    const sorted = [...assessments].reverse();

    return sorted.map((a: any, idx: number) => {
      const scores = (a.scoresJson as any[]) || [];
      const entry: Record<string, any> = {
        date: new Date(a.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: new Date(a.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        compositeScore: a.compositeScore,
        tier: a.compositeTier,
        index: idx,
      };

      // Map each attribute score
      ATTRIBUTES.forEach((attr) => {
        const found = scores.find(
          (s: any) =>
            s.attribute?.toLowerCase().includes(attr.toLowerCase().split(" ")[0]) ||
            attr.toLowerCase().includes(s.attribute?.toLowerCase().split(" ")[0] || ""),
        );
        entry[attr] = found?.score ?? null;
      });

      return entry;
    });
  }, [assessments]);

  // Calculate deltas between most recent and previous
  const deltas = useMemo(() => {
    if (timelineData.length < 2) return null;
    const latest = timelineData[timelineData.length - 1];
    const previous = timelineData[timelineData.length - 2];
    const result: Record<string, number> = {};
    ATTRIBUTES.forEach((attr) => {
      const l = latest[attr] ?? 0;
      const p = previous[attr] ?? 0;
      result[attr] = l - p;
    });
    result["composite"] = (latest.compositeScore ?? 0) - (previous.compositeScore ?? 0);
    return result;
  }, [timelineData]);

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
          <p className="text-muted-foreground mb-6">Sign in to compare your assessments over time.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
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

      <main className="container pt-20 pb-16 max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/history")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>

        <h1 className="font-display text-3xl font-bold mb-2">Compare Over Time</h1>
        <p className="text-muted-foreground mb-8">
          Track how your vibe coding maturity evolves across assessments.
        </p>

        {timelineData.length < 2 ? (
          <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Need More Data
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {timelineData.length === 0
                ? "Complete your first assessment to start tracking progress."
                : "Complete at least one more assessment to see trends. The rubric recommends reassessing every 6 months."}
            </p>
            <Button onClick={() => navigate("/chat-assess")}>
              {timelineData.length === 0 ? "Take Assessment" : "Take Another Assessment"}
            </Button>
          </div>
        ) : (
          <>
            {/* Composite Score Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/50 p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-bold">Composite Score</h2>
                  <p className="text-sm text-muted-foreground">Overall maturity trend (8-32)</p>
                </div>
                {deltas && (
                  <DeltaBadge delta={deltas["composite"]} label="vs. previous" />
                )}
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "oklch(0.55 0 0)" }}
                      axisLine={{ stroke: "oklch(0.3 0 0)" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[8, 32]}
                      ticks={[8, 14, 20, 26, 32]}
                      tick={{ fontSize: 11, fill: "oklch(0.55 0 0)" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.15 0.01 260)",
                        border: "1px solid oklch(0.25 0.01 260)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "oklch(0.7 0 0)" }}
                      formatter={(value: any, name: string) => [
                        `${value}/32`,
                        "Composite Score",
                      ]}
                      labelFormatter={(label: string, payload: any[]) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${item.fullDate} — ${item.tier}` : label;
                      }}
                    />
                    {/* Tier boundary lines */}
                    <ReferenceLine y={14} stroke="oklch(0.3 0.05 195)" strokeDasharray="3 3" />
                    <ReferenceLine y={20} stroke="oklch(0.3 0.05 195)" strokeDasharray="3 3" />
                    <ReferenceLine y={26} stroke="oklch(0.3 0.05 195)" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="compositeScore"
                      stroke="oklch(0.75 0.18 195)"
                      strokeWidth={2.5}
                      dot={{ fill: "oklch(0.75 0.18 195)", r: 5, strokeWidth: 2, stroke: "oklch(0.15 0.01 260)" }}
                      activeDot={{ r: 7, stroke: "oklch(0.75 0.18 195)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Tier labels */}
              <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground/50 px-8">
                <span>Novice (8-13)</span>
                <span>Practitioner (14-19)</span>
                <span>Senior (20-25)</span>
                <span>Principal (26-32)</span>
              </div>
            </motion.div>

            {/* Small Multiples — One per Attribute */}
            <h2 className="font-display text-lg font-bold mb-4">Attribute Trends</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {ATTRIBUTES.map((attr, i) => (
                <motion.div
                  key={attr}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card/50 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-sm font-semibold truncate">{attr}</h3>
                    {deltas && <DeltaBadge delta={deltas[attr]} small />}
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: "oklch(0.45 0 0)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[1, 4]}
                          ticks={[1, 2, 3, 4]}
                          tick={{ fontSize: 9, fill: "oklch(0.45 0 0)" }}
                          axisLine={false}
                          tickLine={false}
                          width={16}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(0.15 0.01 260)",
                            border: "1px solid oklch(0.25 0.01 260)",
                            borderRadius: "6px",
                            fontSize: "11px",
                            padding: "4px 8px",
                          }}
                          formatter={(value: any) => [`Tier ${value}`, attr]}
                          labelFormatter={(label: string, payload: any[]) => {
                            return payload?.[0]?.payload?.fullDate || label;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey={attr}
                          stroke={ATTRIBUTE_COLORS[i]}
                          strokeWidth={2}
                          dot={{
                            fill: ATTRIBUTE_COLORS[i],
                            r: 4,
                            strokeWidth: 2,
                            stroke: "oklch(0.15 0.01 260)",
                          }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/** Small delta badge component */
function DeltaBadge({ delta, label, small }: { delta: number; label?: string; small?: boolean }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
  const color = isPositive
    ? "text-emerald-400 bg-emerald-400/10"
    : isNeutral
      ? "text-muted-foreground bg-secondary"
      : "text-red-400 bg-red-400/10";

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${color}`}>
      <Icon className={small ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span className={`font-mono font-bold ${small ? "text-[10px]" : "text-xs"}`}>
        {isPositive ? "+" : ""}
        {delta}
      </span>
      {label && <span className={`${small ? "text-[9px]" : "text-[10px]"} opacity-70`}>{label}</span>}
    </div>
  );
}
