import { FitnessGoal } from './fitness';
import type { UserAnswers } from './answers';

/** One request we’ll send to the search API for a specific row */
export interface SearchPrompt {
  id: string;                 // e.g., "strength-essentials"
  label: string;              // UI row title: "Strength essentials"
  goal: FitnessGoal;          // which goal it belongs to
  keywords: string[];         // ["adjustable dumbbells","resistance bands"]
  collections?: string[];     // optional narrowing
  includeTags?: string[];     // optional filters
  excludeTags?: string[];     // optional filters
  priceMax?: number | null;   // optional budget
}

/** The full plan built from answers — multiple prompts = multiple rows */
export interface SearchPlan {
  fromAnswers: UserAnswers;       // snapshot for debugging/auditing
  prompts: SearchPrompt[];        // 3–6 prompts total (per selected goal)
}

/** Minimal product shape for rendering */
export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  tags?: string[];
}

/** UI-ready grouping: one horizontal row per prompt */
export interface ResultGroup {
  promptId: string;
  label: string;           // row header in the UI
  items: Product[];        // products for that row
}
