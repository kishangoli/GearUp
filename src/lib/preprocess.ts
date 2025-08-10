// src/lib/preprocess.ts
import type { UserAnswers } from "../types/answers";

export function preprocessAnswers(raw: Partial<UserAnswers>): UserAnswers {
  // Start with defaults
  const defaults: UserAnswers = {
    goals: [],
    experienceLevel: "beginner",
    trainingEnvironment: "home",
    dietaryPreferences: [],
    recoveryMethods: [],
  };

  const clean = { ...defaults, ...raw };

  // Normalize casing/trim strings in arrays
  clean.goals = (clean.goals || []).map(g => g.toLowerCase().trim());
  clean.dietaryPreferences = (clean.dietaryPreferences || []).map(d => d.toLowerCase().trim());
  clean.recoveryMethods = (clean.recoveryMethods || []).map(r => r.toLowerCase().trim());

  // Example: standardize common synonyms
  const goalMap: Record<string, string> = {
    "weight lifting": "strength",
    "muscle gain": "strength",
    "endurance": "running",
  };
  clean.goals = clean.goals.map(g => goalMap[g] || g);

  // Ensure valid experience level
  if (!["beginner", "intermediate", "advanced"].includes(clean.experienceLevel)) {
    clean.experienceLevel = "beginner";
  }

  // Standardize environment
  if (!["home", "gym", "outdoor"].includes(clean.trainingEnvironment)) {
    clean.trainingEnvironment = "home";
  }

  return clean;
}
