// src/lib/preprocess.ts
import type { UserAnswers } from '../types/answers';
import type { FitnessGoal, ExperienceLevel } from '../types/fitness';

// Normalize a possibly messy string into a FitnessGoal if possible
function normalizeGoal(value: unknown): FitnessGoal | null {
  if (typeof value !== 'string') return null;
  const s = value.trim().toLowerCase();
  const map: Record<string, FitnessGoal> = {
    strength: 'strength',
    lifting: 'strength',
    muscle: 'strength',
    hypertrophy: 'strength',

    recovery: 'recovery',
    rehab: 'recovery',
    mobility: 'recovery',

    dietary: 'dietary',
    diet: 'dietary',
    nutrition: 'dietary',

    running: 'running',
    cardio: 'running',
    endurance: 'running',
  };
  return (map[s] as FitnessGoal) ?? null;
}

function normalizeLevel(value: unknown): ExperienceLevel {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
    return value;
  }
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'beginner' || s === 'intermediate' || s === 'advanced') {
      return s;
    }
  }
  return 'beginner';
}

/**
 * Bring partial/raw answers into a consistent, type-safe shape that matches `UserAnswers`.
 * - Deduplicates and normalizes goals.
 * - Ensures `experienceLevels` exists for each selected goal (default 'beginner').
 * - Drops experience entries for unselected goals.
 * - Normalizes `followUps` to only include selected goals.
 */
export function preprocessAnswers(raw: Partial<UserAnswers>): UserAnswers {
  // 1) normalize goals (accept strings or typed values)
  const rawGoals = Array.isArray(raw?.goals) ? raw!.goals : [];
  const normalizedGoals: FitnessGoal[] = [];
  const seen = new Set<FitnessGoal>();

  for (const g of rawGoals) {
    const goal =
      (typeof g === 'string'
        ? (normalizeGoal(g) ?? null)
        : (g as FitnessGoal)) ?? null;
    if (goal && !seen.has(goal)) {
      seen.add(goal);
      normalizedGoals.push(goal);
    }
  }

  // 2) normalize experienceLevels map; ensure an entry for each selected goal
  const inputLevels = (raw?.experienceLevels ?? {}) as Record<string, unknown>;
  const experienceLevels: Record<FitnessGoal, ExperienceLevel> = {} as any;

  for (const goal of normalizedGoals) {
    const level = normalizeLevel(inputLevels[goal]);
    experienceLevels[goal] = level;
  }

  // 3) normalize followUps to only include selected goals (keep original objects)
  const inputFollowUps = (raw?.followUps ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const followUps: Record<FitnessGoal, Record<string, unknown>> = {} as any;

  for (const goal of normalizedGoals) {
    const data = inputFollowUps[goal];
    if (data && typeof data === 'object') {
      followUps[goal] = data;
    }
  }

  // 4) final object matches `UserAnswers`
  return {
    goals: normalizedGoals,
    experienceLevels,
    followUps,
  };
}
