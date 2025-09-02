// src/lib/fal.ts
import type { UserAnswers } from "../types/answers";
import { preprocessAnswers } from "./preprocess";

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
 * Turn the user's answers into 3–6 focused search prompts using the backend server.
 * Each prompt becomes one horizontal row on the Recommendations page.
 */
export async function buildSearchPlanClient(answers: UserAnswers): Promise<SearchPlan> {
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
- Make sure to not recommend items which may be meant for a different skill level than the user selected. (i.e. don't recommend advanced supplements for a beginner or beginner-friendly items for an advanced user)

UserAnswers:
${JSON.stringify(cleanAnswers)}

GOAL-SPECIFIC INSTRUCTIONS:
- strength: Focus on training equipment, progressive overload tools, workout apparel, and supplements aligned with the user's training focus.
- dietary: Suggest supplements, meal prep tools, specific diet-friendly snacks, and cooking appliances based on dietary goal and food preference.
- running: Prioritize sport-specific shoes, training gear, hydration, and skill-development tools based on sport type and training frequency.
- recovery: Recommend tools and products that align with recovery method and timing preference, including mobility aids, therapy gear, and relaxation items.

Return JSON only.
`.trim();

  console.log("Prompt being sent to backend:", prompt);

  // Call the backend server
  try {
    const response = await fetch("https://backend-448821269912.us-central1.run.app/handleFalRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const { output } = await response.json();
    
    let plan: SearchPlan = { prompts: [] };

    try {
      const parsed = JSON.parse(String(output));
      if (Array.isArray(parsed?.prompts)) {
        plan.prompts = parsed.prompts
          .filter((p: any) => p && typeof p.label === "string" && typeof p.query === "string")
          .slice(0, 6);
      }
    } catch (e) {
      console.error("Failed to parse search plan from backend:", e);
      throw new Error("Failed to generate a search plan. Please try again.");
    }

    return plan;
  } catch (error) {
    console.error("Backend failed, using fallback recommendations:", error);
    
    // Fallback recommendations based on user's goals
    const goals = cleanAnswers.goals || [];
    const fallbackPrompts: SearchPrompt[] = [];
    
    if (goals.includes('strength')) {
      fallbackPrompts.push(
        { label: "Strength Training Essentials", query: "dumbbells resistance bands strength training equipment" },
        { label: "Protein & Recovery", query: "protein powder post workout recovery supplements" },
        { label: "Workout Apparel", query: "athletic wear gym clothes workout shirts" },
        { label: "Training Accessories", query: "lifting gloves wrist straps gym accessories" }
      );
    }
    
    if (goals.includes('running')) {
      fallbackPrompts.push(
        { label: "Running Shoes & Gear", query: "running shoes athletic footwear" },
        { label: "Hydration & Nutrition", query: "water bottle electrolytes running nutrition" },
        { label: "Running Apparel", query: "running shorts athletic wear moisture wicking" },
        { label: "Performance Tracking", query: "fitness tracker running watch gps" }
      );
    }
    
    if (goals.includes('dietary')) {
      fallbackPrompts.push(
        { label: "Healthy Snacks", query: "healthy snacks protein bars nutrition" },
        { label: "Supplements & Vitamins", query: "vitamins supplements health nutrition" },
        { label: "Meal Prep Tools", query: "meal prep containers kitchen tools food storage" },
        { label: "Cooking Essentials", query: "blender food processor healthy cooking appliances" }
      );
    }
    
    if (goals.includes('recovery')) {
      fallbackPrompts.push(
        { label: "Recovery Tools", query: "foam roller massage tools muscle recovery" },
        { label: "Sleep & Relaxation", query: "sleep aids relaxation wellness recovery" },
        { label: "Therapy Equipment", query: "heating pad ice packs therapy tools" },
        { label: "Stretching & Mobility", query: "yoga mat stretching bands mobility tools" }
      );
    }
    
    // Always add these general categories to ensure we have at least 4
    const generalCategories = [
      { label: "Fitness Essentials", query: "fitness equipment workout gear exercise" },
      { label: "Health & Wellness", query: "health supplements wellness products vitamins" },
      { label: "Athletic Wear", query: "athletic wear sports clothing workout apparel" },
      { label: "Hydration & Energy", query: "water bottle energy drinks electrolytes hydration" }
    ];
    
    // Add general categories that aren't already covered
    const existingLabels = fallbackPrompts.map(p => p.label.toLowerCase());
    generalCategories.forEach(category => {
      const isAlreadyIncluded = existingLabels.some(label => 
        label.includes(category.label.toLowerCase().split(' ')[0]) || 
        category.label.toLowerCase().includes(label.split(' ')[0])
      );
      
      if (!isAlreadyIncluded) {
        fallbackPrompts.push(category);
      }
    });
    
    // Ensure we have at least 4 categories, add more if needed
    if (fallbackPrompts.length < 4) {
      const additionalCategories = [
        { label: "Training Accessories", query: "gym accessories fitness tools workout equipment" },
        { label: "Outdoor Activities", query: "outdoor gear hiking camping sports equipment" },
        { label: "Home Gym Setup", query: "home gym equipment exercise machines fitness gear" },
        { label: "Sports Performance", query: "sports gear performance equipment athletic accessories" }
      ];
      
      additionalCategories.forEach(category => {
        if (fallbackPrompts.length < 6) {
          fallbackPrompts.push(category);
        }
      });
    }
    
    return { prompts: fallbackPrompts };
  }
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

  // Call the backend server
  try {
    const response = await fetch("https://backend-448821269912.us-central1.run.app/handleFalRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    console.log("Tips backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tips backend error response:", errorText);
      throw new Error(`Tips backend server error (${response.status}): ${errorText}`);
    }

    const { output } = await response.json();
    console.log("Tips backend output:", output);

    const raw =
      (output as any)?.output ??
      (output as any)?.output?.content ??
      (typeof output === "string" ? output : "");

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
      console.error("Failed to parse cart tips from backend:", e);
      throw new Error("Failed to generate tips for your items. Please try again.");
    }
  } catch (error) {
    console.error("Tips network or backend error:", error);
    console.log("Using enhanced fallback tips for cart items");
    
    // Enhanced fallback tips based on cart items
    const fallbackTips: CartTips["tips"] = [];
    
    // Analyze cart items to provide better tips
    const hasProtein = cart.some(item => 
      item.title.toLowerCase().includes('protein') || 
      item.tags?.some(tag => tag.toLowerCase().includes('protein'))
    );
    
    const hasEquipment = cart.some(item => 
      item.title.toLowerCase().includes('dumbbell') || 
      item.title.toLowerCase().includes('resistance') ||
      item.title.toLowerCase().includes('equipment') ||
      item.productType?.toLowerCase().includes('equipment')
    );
    
    const hasSupplements = cart.some(item => 
      item.title.toLowerCase().includes('supplement') || 
      item.title.toLowerCase().includes('vitamin') ||
      item.tags?.some(tag => tag.toLowerCase().includes('supplement'))
    );
    
    const hasApparel = cart.some(item => 
      item.title.toLowerCase().includes('shirt') || 
      item.title.toLowerCase().includes('shorts') ||
      item.title.toLowerCase().includes('wear') ||
      item.productType?.toLowerCase().includes('apparel')
    );

    // Add specific tips based on what's in the cart
    if (hasProtein) {
      fallbackTips.push({
        title: "Maximize Your Protein Intake",
        tipType: "recipe",
        items: cart.filter(item => 
          item.title.toLowerCase().includes('protein')).map(item => item.title),
        steps: [
          "Mix 1-2 scoops with 8-12oz water or milk",
          "Consume within 30 minutes post-workout",
          "Try blending with banana for better taste"
        ],
        timeEstimate: "2 min",
        notes: "Best results when combined with resistance training"
      });
    }

    if (hasEquipment) {
      fallbackTips.push({
        title: "Quick Equipment Workout",
        tipType: "routine",
        items: cart.filter(item => 
          item.title.toLowerCase().includes('dumbbell') || 
          item.title.toLowerCase().includes('resistance')).map(item => item.title),
        steps: [
          "Start with 5-minute warm-up",
          "3 sets of 8-12 reps per exercise",
          "Rest 30-60 seconds between sets",
          "Cool down with light stretching"
        ],
        timeEstimate: "20-30 min",
        notes: "Focus on proper form over heavy weight"
      });
    }

    if (hasSupplements) {
      fallbackTips.push({
        title: "Supplement Timing Guide",
        tipType: "usage",
        items: cart.filter(item => 
          item.title.toLowerCase().includes('supplement') || 
          item.title.toLowerCase().includes('vitamin')).map(item => item.title),
        steps: [
          "Take with food to improve absorption",
          "Follow dosage instructions on label",
          "Stay consistent with daily timing",
          "Track how you feel over 2-4 weeks"
        ],
        timeEstimate: "1 min daily",
        notes: "Consult healthcare provider if you have concerns"
      });
    }

    if (hasApparel) {
      fallbackTips.push({
        title: "Workout Gear Care",
        tipType: "care",
        items: cart.filter(item => 
          item.title.toLowerCase().includes('shirt') || 
          item.title.toLowerCase().includes('shorts')).map(item => item.title),
        steps: [
          "Wash in cold water to prevent shrinking",
          "Turn inside out before washing",
          "Air dry to maintain fabric integrity",
          "Avoid fabric softener on moisture-wicking materials"
        ],
        timeEstimate: "5 min prep",
        notes: "Proper care extends the life of your gear"
      });
    }

    // Add general tips if we don't have enough specific ones
    if (fallbackTips.length < 3) {
      const generalTips = [
        {
          title: "Start Your Fitness Journey",
          tipType: "routine" as const,
          items: cart.slice(0, 2).map(item => item.title),
          steps: [
            "Set realistic, achievable goals",
            "Start with 2-3 workouts per week",
            "Track your progress consistently",
            "Listen to your body and rest when needed"
          ],
          timeEstimate: "Plan 15 min",
          notes: "Consistency beats intensity for long-term success"
        },
        {
          title: "Optimize Your Purchases",
          tipType: "usage" as const,
          items: cart.slice(0, 3).map(item => item.title),
          steps: [
            "Read all product instructions carefully",
            "Start with recommended beginner doses/weights",
            "Create a consistent routine",
            "Track results and adjust as needed"
          ],
          timeEstimate: "10 min setup",
          notes: "Getting the most value from your fitness investments"
        }
      ];

      generalTips.forEach(tip => {
        if (fallbackTips.length < 5) {
          fallbackTips.push(tip);
        }
      });
    }

    return { tips: fallbackTips };
  }
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

  // Call the backend server
  const response = await fetch("https://backend-448821269912.us-central1.run.app/handleFalRequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to call backend server");
  }

  const { output } = await response.json();

  const raw =
    (output as any)?.output ??
    (output as any)?.output?.content ??
    (typeof output === "string" ? output : "");

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
    console.error("Failed to parse prompt blurbs from backend:", e);
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
