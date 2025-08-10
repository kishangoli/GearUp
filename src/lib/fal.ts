// src/lib/fal.ts
import { fal } from "@fal-ai/client";
import type { UserAnswers } from "../types/answers";

/**
 * TEMP (dev/hackathon): keep the key here.
 * For production, move this server-side.
 */
fal.config({
  // Use ONE string: either your fal_live_... token OR "<KEY_ID>:<SECRET>"
  credentials: "1944d3d5-e4ee-4e3f-bc99-3ff9b5661887:61bb8745eb3053d86ef3b61ba09a51e0",
});

export interface SearchPrompt {
  /** Row title in your UI, e.g. "Strength essentials" */
  label: string;
  /** The plain search phrase you’ll send to Shopify search */
  query: string;
}

export interface SearchPlan {
  prompts: SearchPrompt[];
}

/**
 * Turn the user's answers into 3–6 focused search prompts using FAL.
 * Each prompt becomes one horizontal row on the Recommendations page.
 */
export async function buildSearchPlanClient(answers: UserAnswers): Promise<SearchPlan> {
  // Single prompt string (works with fal-ai/any-llm). We pin a model and ask for JSON.
  const prompt = `
You are a product search planner for a fitness shopping app.
Given the user's onboarding answers (goals, experience, follow-ups),
produce 3–6 FOCUSED search prompts for different rows, like:
- "Strength essentials"
- "Recovery tools"
- "Protein & blends"
- "Running hydration & fuel"

STRICT OUTPUT (JSON ONLY):
{
  "prompts": [
    { "label": string, "query": string }
  ]
}

Rules:
- Make each prompt narrow and shoppable (human-readable queries).
- Use the user's data to tailor difficulty, environment (home/gym), budget hints, dietary prefs, etc.
- No extra prose, no code fences, JSON only.

UserAnswers:
${JSON.stringify(answers)}
`.trim();

  const { data } = await fal.run("fal-ai/any-llm", {
    input: {
      model: "openai/gpt-4o-mini", // vendor-prefixed model name
      prompt,
      format: "json",
      temperature: 0.2,
    },
  });

  // Normalize to a string we can JSON.parse
  const raw =
    (data as any)?.output ??
    (data as any)?.output?.content ??
    (typeof data === "string" ? data : "");

  let plan: SearchPlan = { prompts: [] };

  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed?.prompts)) {
      plan.prompts = parsed.prompts
        .filter((p: any) => p && typeof p.label === "string" && typeof p.query === "string")
        .slice(0, 6);
    }
  } catch {
    // Fallback so UI still works if JSON parse fails
    plan.prompts = (answers.goals || []).slice(0, 3).map((g, i) => ({
      label: `${String(g).charAt(0).toUpperCase() + String(g).slice(1)} picks`,
      query: `${String(g)} essentials`,
    }));
  }

  return plan;
}
