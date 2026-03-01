/*
 * Signal / Noise — Assessment State Management
 * Centralized store for assessment scores, persisted to localStorage
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "vibe-coder-assessment-scores";

export interface AssessmentState {
  scores: Record<number, number>; // attributeId -> tier score (1-4)
  completedAt?: string;
}

function loadState(): AssessmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { scores: {} };
}

function saveState(state: AssessmentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAssessmentStore() {
  const [state, setState] = useState<AssessmentState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setScore = useCallback((attributeId: number, score: number) => {
    setState((prev) => ({
      ...prev,
      scores: { ...prev.scores, [attributeId]: score },
    }));
  }, []);

  const completeAssessment = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const resetAssessment = useCallback(() => {
    setState({ scores: {} });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalScore = Object.values(state.scores).reduce((sum, s) => sum + s, 0);
  const answeredCount = Object.keys(state.scores).length;
  const isComplete = answeredCount === 8;

  return {
    scores: state.scores,
    completedAt: state.completedAt,
    totalScore,
    answeredCount,
    isComplete,
    setScore,
    completeAssessment,
    resetAssessment,
  };
}
