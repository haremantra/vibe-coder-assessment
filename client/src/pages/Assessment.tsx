/*
 * Signal / Noise — Assessment Page
 * Design: Step-through instrument panel with tier selection cards
 * Dark navy, cyan accents, precision gauge-like progress
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { ATTRIBUTES } from "@/lib/rubricData";
import { useAssessmentStore } from "@/hooks/useAssessmentStore";

export default function Assessment() {
  const [, navigate] = useLocation();
  const { scores, setScore, completeAssessment, resetAssessment, answeredCount, isComplete } = useAssessmentStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const attribute = ATTRIBUTES[currentIndex];
  const currentScore = scores[attribute.id];
  const progress = (answeredCount / 8) * 100;

  const canGoNext = currentIndex < 7;
  const canGoPrev = currentIndex > 0;

  const handleSelect = (tier: number) => {
    setScore(attribute.id, tier);
  };

  const handleNext = () => {
    if (canGoNext) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (canGoPrev) setCurrentIndex((i) => i - 1);
  };

  const handleFinish = () => {
    completeAssessment();
    navigate("/results");
  };

  const handleReset = () => {
    resetAssessment();
    setCurrentIndex(0);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="font-display text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            Signal / Noise
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {answeredCount}/8 calibrated
              </span>
              <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Reset confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h3 className="font-display font-semibold text-card-foreground">Reset Assessment?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This will clear all your scores and start over. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleReset}>
                  Reset All
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribute navigation dots */}
      <div className="container pt-6 pb-2">
        <div className="flex items-center justify-center gap-2">
          {ATTRIBUTES.map((attr, i) => {
            const isAnswered = scores[attr.id] !== undefined;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={attr.id}
                onClick={() => setCurrentIndex(i)}
                className={`relative w-8 h-8 rounded-md flex items-center justify-center text-xs font-mono transition-all duration-200 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                    : isAnswered
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {isAnswered && !isCurrent ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="container py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={attribute.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Attribute header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-xs text-primary/60 tracking-widest uppercase">
                  Attribute {attribute.id} of 8
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
                {attribute.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {attribute.description}
              </p>
            </div>

            {/* Scoring note */}
            <div className="instrument-border rounded-lg p-4 bg-accent/5 mb-8 max-w-2xl">
              <p className="text-sm text-muted-foreground">
                <span className="text-accent font-semibold">Scoring discipline:</span>{" "}
                If you're between two tiers, score yourself at the{" "}
                <span className="text-foreground font-medium">lower tier</span>.
                Maturity is about reliable, repeatable behavior, not occasional excellence.
              </p>
            </div>

            {/* Tier selection cards */}
            <div className="grid gap-4 lg:grid-cols-2">
              {attribute.tiers.map((tier) => {
                const isSelected = currentScore === tier.tier;
                return (
                  <motion.button
                    key={tier.tier}
                    onClick={() => handleSelect(tier.tier)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`text-left rounded-lg p-5 transition-all duration-200 border ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/60 bg-card/50 hover:border-primary/30 hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-md flex items-center justify-center font-mono text-sm font-bold ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {tier.tier}
                        </span>
                        <div>
                          <span className={`font-display font-semibold text-sm ${isSelected ? "text-primary" : "text-card-foreground"}`}>
                            Tier {tier.tier}: {tier.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {tier.title}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>

                    <ul className="space-y-1.5 mb-4">
                      {tier.bullets.map((b, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary/40 mt-1.5 shrink-0">—</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-border/40 pt-3">
                      <span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider">
                        Evidence signals
                      </span>
                      <ul className="mt-1.5 space-y-1">
                        {tier.evidenceSignals.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground/80 flex items-start gap-2">
                            <span className="text-accent/50 mt-0.5 shrink-0">▸</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 z-40">
        <div className="container flex items-center justify-between h-16">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="font-display"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="text-center">
            {currentScore !== undefined && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-mono text-primary"
              >
                Tier {currentScore} selected
              </motion.span>
            )}
          </div>

          {currentIndex === 7 && isComplete ? (
            <Button
              onClick={handleFinish}
              className="bg-accent text-accent-foreground hover:bg-accent/90 glow-amber font-display"
            >
              View Results
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={!canGoNext}
              className="font-display"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
