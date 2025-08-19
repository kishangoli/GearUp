// src/lib/fal.ts
import { fal } from "@fal-ai/client";
import type { UserAnswers } from "../types/answers";
import { preprocessAnswers } from "../lib/preprocess";


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
  // ✅ Step 2: run preprocessing before using answers in prompt
  const cleanAnswers = preprocessAnswers(answers);

 const prompt = `
You are a product search planner for a fitness & nutrition Shopify store.

TASK:
Generate 3–6 focused product search prompts (each with "label" and "query") 
that match the user's onboarding answers.

STRICT OUTPUT FORMAT:
{
  "prompts": [
    { "label": string, "query": string }
  ]
}

GENERAL RULES:
- Each prompt must be narrow, specific, and ready for Shopify search.
- Always incorporate all 3 questions for the selected goal.
- Include variety: gear, apparel, accessories, nutrition, recovery (as relevant).
- Avoid repeating the same product type in multiple prompts.
- Tailor difficulty, environment (home/gym), dietary prefs, skill level, etc.
- Use plain, human-readable product names in labels, but keep queries optimized.
- No emojis, no hype, no guarantees or medical claims.
- Do not recommend large scale items (e.g. gym equipment) unless explicitly mentioned.
- Make sure to not recommend items which may be better suited for a different goal. (i.e. don't recommend running shoes for strength training or foam rollers for sports)
- Make sure to adhere to the user's dietary preferences and allergies.
- Make sure to not reccomend items which may be meant for a different skill level than the user selected. (i.e. don't recommend advanced supplements for a beginner or beginner-friendly items for an advanced user)
- 

UserAnswers:
${JSON.stringify(cleanAnswers)}


GOAL-SPECIFIC INSTRUCTIONS:
- strength: Focus on training equipment, progressive overload tools, workout apparel, and supplements aligned with the user's training focus.
- dietary: Suggest supplements, meal prep tools, specific diet-friendly snacks, and cooking appliances based on dietary goal and food preference.
- running: Prioritize sport-specific shoes, training gear, hydration, and skill-development tools based on sport type and training frequency.
- recovery: Recommend tools and products that align with recovery method and timing preference, including mobility aids, therapy gear, and relaxation items.

Return JSON only.
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
  } catch (e) {
    console.error("Failed to parse search plan from LLM:", e);
    // Re-throw the error so the UI layer can handle it.
    throw new Error("Failed to generate a search plan. Please try again.");
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
  } catch (e) {
    console.error("Failed to parse cart tips from LLM:", e);
    // Re-throw the error so the UI layer can handle it.
    throw new Error("Failed to generate tips for your items. Please try again.");
  }

  // This fallback is now unreachable if an error occurs, which is intended.
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
  } catch (e) {
    console.error("Failed to parse prompt blurbs from LLM:", e);
    // Do not throw here, as blurbs are non-essential.
    // A fallback will be generated, which is acceptable.
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
