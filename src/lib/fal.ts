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

/* -------------------------------------------------------------------------- */
/*                           SEARCH PLAN (EXISTING)                           */
/* -------------------------------------------------------------------------- */

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
    plan.prompts = (answers.goals || []).slice(0, 3).map((g) => ({
      label: `${String(g).charAt(0).toUpperCase() + String(g).slice(1)} picks`,
      query: `${String(g)} essentials`,
    }));
  }

  return plan;
}

/* -------------------------------------------------------------------------- */
/*                             CART → TIPS (NEW)                              */
/* -------------------------------------------------------------------------- */

export interface CartItemInput {
  id: string;
  title: string;
  quantity: number;
  variantTitle?: string;
  productType?: string;
  tags?: string[];
}

export interface CartTips {
  tips: Array<{
    title: string;
    tipType: "recipe" | "routine" | "care" | "usage" | "combo";
    items: string[];
    steps?: string[];
    timeEstimate?: string;
    notes?: string;
  }>;
}

/**
 * Generate 3–5 concise, actionable tips tailored to the shopper's saved/cart items.
 * Returns strict JSON per CartTips. Includes a safe fallback if parsing fails.
 */
export async function buildCartTipsClient(
  cart: CartItemInput[],
  context?: Partial<UserAnswers>
): Promise<CartTips> {
  // If the cart is empty, short-circuit.
  if (!cart || cart.length === 0) {
    return { tips: [] };
  }

  const prompt = `
You are a concise shopping coach inside a Shopify Mini.
Given the cart items and optional user context, return 3–5 practical tips
that the shopper can apply now. STRICT OUTPUT: JSON ONLY with this exact shape:

{
  "tips": [
    {
      "title": string,
      "tipType": "recipe" | "routine" | "care" | "usage" | "combo",
      "items": string[],
      "steps"?: string[],
      "timeEstimate"?: string,
      "notes"?: string
    }
  ]
}

Rules:
- Tips must reference only items actually in the cart (by product title).
- Keep steps short, specific, and safe.
- Prefer actionable guidance: quick recipe, short workout routine, product care, or how-to usage.
- No prose outside JSON. No code fences.

Cart:
${JSON.stringify(
  cart.map((c) => ({
    title: c.title,
    quantity: c.quantity,
    variant: c.variantTitle,
    type: c.productType,
    tags: c.tags?.slice(0, 8),
  })),
  null,
  2
)}

Context:
${JSON.stringify(context ?? {}, null, 2)}
`.trim();

  const { data } = await fal.run("fal-ai/any-llm", {
    input: {
      model: "openai/gpt-4o-mini",
      prompt,
      format: "json",
      temperature: 0.2,
      max_output_tokens: 900,
    },
  });

  const raw =
    (data as any)?.output ??
    (data as any)?.output?.content ??
    (typeof data === "string" ? data : "");

  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed?.tips)) {
      const tips = parsed.tips.slice(0, 5).map((t: any) => ({
        title: String(t?.title ?? "Tip"),
        tipType: (t?.tipType ?? "usage") as CartTips["tips"][number]["tipType"],
        items: Array.isArray(t?.items) ? t.items.map(String) : [],
        steps: Array.isArray(t?.steps) ? t.steps.map(String) : undefined,
        timeEstimate: t?.timeEstimate ? String(t.timeEstimate) : undefined,
        notes: t?.notes ? String(t.notes) : undefined,
      }));
      return { tips };
    }
  } catch {
    // fall through to fallback
  }

  // Safe fallback: one generic usage tip per first few items
  return {
    tips: cart.slice(0, 3).map((c) => ({
      title: `How to use ${c.title}`,
      tipType: "usage",
      items: [c.title],
      steps: ["Unbox safely", "Read quick-start notes", "Try a short 10-minute session"],
      timeEstimate: "10 min",
      notes: "Auto-generated fallback.",
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*                  PER-CATEGORY ONE-LINERS ("WHY THIS ROW") (NEW)           */
/* -------------------------------------------------------------------------- */

export interface PromptBlurb {
  label: string;
  why: string; // one-liner
}

/**
 * Generate a concise, benefit-focused one-liner for each prompt row.
 * Returns a map keyed by prompt label.
 */
export async function generatePromptBlurbsClient(
  prompts: SearchPrompt[],
  answers?: Partial<UserAnswers>
): Promise<Record<string, string>> {
  if (!prompts || prompts.length === 0) return {};

  const prompt = `
You write short, helpful one-liners for a shopping app's category rows.
For each prompt {label, query}, return ONE sentence (<= 120 chars) that
explains why this category is useful and what benefit it brings.

STRICT OUTPUT (JSON ONLY):
{
  "blurbs": [
    { "label": string, "why": string }
  ]
}

Rules:
- One sentence per item, positive and specific.
- No emojis, no hype, no guarantees or medical claims.
- Mention a use case or benefit; keep it shoppable and relevant to the query.

Prompts:
${JSON.stringify(prompts, null, 2)}

UserAnswers (context):
${JSON.stringify(answers ?? {}, null, 2)}
`.trim();

  const { data } = await fal.run("fal-ai/any-llm", {
    input: {
      model: "openai/gpt-4o-mini",
      prompt,
      format: "json",
      temperature: 0.3,
      max_output_tokens: 600,
    },
  });

  const raw =
    (data as any)?.output ??
    (data as any)?.output?.content ??
    (typeof data === "string" ? data : "");

  const out: Record<string, string> = {};
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed?.blurbs)) {
      for (const b of parsed.blurbs) {
        if (b && typeof b.label === "string" && typeof b.why === "string") {
          out[b.label] = b.why.trim();
        }
      }
    }
  } catch {
    // noop — we’ll fill fallbacks below
  }

  // Fallback: deterministic, non-AI blurbs so the UI always has copy
  if (Object.keys(out).length === 0) {
    const goal = (answers?.goals?.[0] ?? "").toString().toLowerCase();
    for (const p of prompts) {
      const base = p.label.toLowerCase();
      out[p.label] =
        goal && base.includes(goal)
          ? `Focused picks to support your ${goal} goals.`
          : `Curated picks to help you shop ${base} with confidence.`;
    }
  }

  return out;
}
