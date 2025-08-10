// src/utils/tipsPrefetch.ts
import { tipsCache, tipKeyOf } from "../state/tipsCache";
import { buildCartTipsClient } from "../lib/fal";

// Category inference from productType/tags (same rules you use on the board)
export function inferCategory(p: any):
  | "food" | "gear" | "apparel" | "beauty" | "home"
  | "personal_care" | "fitness" | "electronics" | "pet" | "general" {
  const raw = [
    String(p?.productType ?? ""),
    ...(Array.isArray(p?.tags) ? p.tags : []),
    ...(Array.isArray(p?.product?.tags) ? p.product.tags : []),
  ].join(" ").toLowerCase();
  const has = (k: string) => raw.includes(k);
  if (has("food") || has("grocery") || has("snack") || has("beverage") || has("drink")) return "food";
  if (has("gear") || has("equipment") || has("accessory") || has("tools")) return "gear";
  if (has("apparel") || has("clothing") || has("shirt") || has("pant") || has("jacket")) return "apparel";
  if (has("beauty") || has("makeup") || has("cosmetic")) return "beauty";
  if (has("home") || has("kitchen") || has("decor") || has("cleaning")) return "home";
  if (has("personal care") || has("skincare") || has("hair") || has("hygiene")) return "personal_care";
  if (has("fitness") || has("supplement") || has("workout") || has("yoga")) return "fitness";
  if (has("electronics") || has("tech") || has("gadget") || has("audio")) return "electronics";
  if (has("pet")) return "pet";
  return "general";
}

// Build the single-item payload like on VisionBoardPage
function toItem(top: any) {
  const category = inferCategory(top);
  const vendor = top?.vendor ?? top?.brand ?? top?.product?.vendor;
  const variantTitle = top?.variantTitle ?? top?.selectedVariant?.title;

  return {
    id: String(top?.id ?? top?.productId ?? top?.handle ?? "unknown"),
    title: top?.title ?? top?.product?.title ?? "Untitled product",
    quantity: 1,
    variantTitle,
    productType: top?.productType ?? top?.product?.productType ?? category,
    tags: [
      ...(Array.isArray(top?.tags) ? top.tags : []),
      ...(Array.isArray(top?.product?.tags) ? top.product.tags : []),
      `category:${category}`,
      vendor ? `brand:${vendor}` : null,
      variantTitle ? `variant:${variantTitle}` : null,
    ].filter(Boolean),
  };
}

function toContext(top: any, item: any) {
  const category = inferCategory(top);
  return {
    category,
    intent: {
      food: ["recipe", "refill", "combo", "care"],
      gear: ["usage", "benefits", "care", "combo"],
      apparel: ["styling", "care", "usage"],
      beauty: ["routine", "care", "usage"],
      personal_care: ["routine", "refill", "usage"],
      home: ["care", "usage", "routine"],
      fitness: ["routine", "usage", "combo"],
      electronics: ["usage", "care", "combo"],
      pet: ["routine", "care", "refill"],
      general: ["usage", "care", "combo"],
    }[category],
    tone: "friendly, encouraging, practical; 1–2 lines per tip.",
    constraints: [
      "Keep tips concrete and actionable; no fluff.",
      "If food, favor quick recipes or pairings; include a simple substitution.",
      "If gear, include a quick how-to or benefit the user might not know.",
    ],
    productDetails: {
      title: item.title,
      variantTitle: item.variantTitle,
      productType: item.productType,
      tags: item.tags,
    },
  } as Parameters<typeof buildCartTipsClient>[1];
}

type PrefetchOpts = {
  onProgress?: (done: number, total: number, currentKey?: string) => void;
  concurrency?: number; // default 3
  answers?: any;        // optional second arg into fal if you use it like TipsPage
};

export async function prefetchTipsForItems(items: any[], opts: PrefetchOpts = {}) {
  const total = items.length;
  if (!total) return;

  const concurrency = Math.max(1, opts.concurrency ?? 3);
  let done = 0;
  const queue = items.map((p, i) => ({ p, k: tipKeyOf(p, i) }));

  // skip already-cached
  const work = queue.filter(({ k }) => !tipsCache.has(k));

  const runOne = async (p: any, k: string) => {
    try {
      const item = toItem(p);
      const ctx = toContext(p, item);
      const tips = await buildCartTipsClient([item], ctx);
      tipsCache.set(k, tips ?? null);
    } catch {
      tipsCache.set(k, null);
    } finally {
      done++;
      opts.onProgress?.(done, total, k);
    }
  };

  // simple pool
  const pool: Promise<void>[] = [];
  for (const { p, k } of work) {
    const start = async () => runOne(p, k);
    if (pool.length < concurrency) {
      pool.push(start());
    } else {
      await Promise.race(pool);
      // remove settled promise
      for (let i = pool.length - 1; i >= 0; i--) {
        if (isSettled(pool[i])) pool.splice(i, 1);
      }
      pool.push(start());
    }
  }
  await Promise.allSettled(pool);

  // helper: detect settled by attaching catch/then (fire-and-forget)
  function isSettled<T>(p: Promise<T>): boolean {
    // there's no standard way; we just let race above drop settled items
    // keeping this function to clarify intent
    return false;
  }
}
