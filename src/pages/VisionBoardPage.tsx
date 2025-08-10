import React from "react";
import SwipeStack from "../components/ui/SwipeStack";
import { useVisionBoard } from "../context/VisionBoardContext";
import { useShopCartActions } from "@shopify/shop-minis-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildCartTipsClient } from "../lib/fal";
import { tipsCache } from "../state/tipsCache";           // shared cache filled by Warmup
import { inferCategory } from "../utils/tipsPrefetch";     // same rules as warmup

/* ───────────────────────────── Helpers ───────────────────────────── */

const TIPS_OFFSET_Y = 400; // keep your current positioning

/** Normalize any LLM tip shape into a clear title + up to 2 short bullets. */
function normalizeTip(raw: any): { title: string; bullets: string[] } {
  const title =
    typeof raw === "string"
      ? raw
      : raw?.title ||
        (Array.isArray(raw?.steps) && raw.steps[0]) ||
        (typeof raw?.notes === "string" ? raw.notes.split(/[.·•-]\s*/)[0] : "Tip");

  let bullets: string[] = [];
  if (Array.isArray(raw?.steps) && raw.steps.length) {
    bullets = raw.steps.filter(Boolean).map(String).slice(0, 2);
  } else if (typeof raw?.notes === "string") {
    bullets = raw.notes
      .split(/(?:\. |\n|·|•|- )/g)
      .filter(Boolean)
      .slice(0, 2);
  }

  const clean = (s: string) => s.replace(/\s+/g, " ").replace(/^[-•·]\s*/, "").trim();

  return {
    title: clean(title),
    bullets: bullets.map(clean).filter((s) => s.length > 0).slice(0, 2),
  };
}

/* ───────────────────────────── Page ───────────────────────────── */

type VisionBoardPageProps = { onBack: () => void };

export default function VisionBoardPage({ onBack }: VisionBoardPageProps) {
  const { items, remove, clear } = useVisionBoard();
  const { addToCart } = useShopCartActions();

  // lock page scroll while here
  React.useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  const keyOf = (p: any, i: number) => String(p?.id ?? p?.productId ?? p?.handle ?? i);

  /* ── Dock icons (always visible) ── */
  const leftRef = React.useRef<HTMLDivElement>(null);
  const rightRef = React.useRef<HTMLDivElement>(null);
  const [hoverSide, setHoverSide] = React.useState<"left" | "right" | null>(null);
  const [pulseSide, setPulseSide] = React.useState<"left" | "right" | null>(null);
  const getRects = React.useCallback(
    () => ({
      left: leftRef.current?.getBoundingClientRect() ?? null,
      right: rightRef.current?.getBoundingClientRect() ?? null,
    }),
    []
  );
  const triggerPulse = (side: "left" | "right") => {
    setPulseSide(side);
    window.setTimeout(() => setPulseSide((s) => (s === side ? null : s)), 220);
  };

  /* ── Swipes ── */
  const handleSwipeLeft = async (key: string) => {
    remove(key);
  };

  const pickIds = (p: any) => {
    const productId = p?.id ?? p?.productId ?? p?.gid ?? p?.product?.id ?? p?.product?.gid;
    const variant =
      p?.selectedVariant ??
      p?.variant ??
      p?.variants?.[0] ??
      p?.variants?.nodes?.[0] ??
      p?.variants?.edges?.[0]?.node ??
      p?.productVariants?.[0] ??
      p?.defaultVariant ??
      p?.firstAvailableVariant;
    const productVariantId = variant?.id ?? variant?.gid ?? variant?.productVariantId ?? variant?.variantId ?? p.defaultVariantId;
    return { productId, productVariantId };
  };

  const handleSwipeRight = async (key: string) => {
    const idx = items.findIndex((p, i) => keyOf(p, i) === key);
    remove(key); // remove immediately so empty-state updates
    if (idx === -1) return;
    const product = items[idx];
    const { productId, productVariantId } = pickIds(product);
    if (!productId || !productVariantId) return;
    try {
      await addToCart({ productId, productVariantId, quantity: 1 });
    } catch {
      /* non-blocking */
    }
  };

  /* ── Tips for the top product ── */
  const [top, setTop] = React.useState<{ key: string; product: any } | null>(null);
  const [tipsState, setTipsState] = React.useState<{
    loading: boolean;
    error: string | null;
    tips: any | null;
  }>({ loading: false, error: null, tips: null });

  // NEW: collapsed by default, open only when arrow is clicked
  const [tipsOpen, setTipsOpen] = React.useState(false);
  React.useEffect(() => {
    // reset to collapsed when the top card changes
    setTipsOpen(false);
  }, [top?.key]);

  React.useEffect(() => {
    let cancelled = false;
    if (!top) {
      setTipsState({ loading: false, error: null, tips: null });
      return;
    }

    // 1) Cache first (should be warm after Warmup page)
    const cached = tipsCache.get(top.key);
    if (cached !== undefined) {
      setTipsState({ loading: false, error: null, tips: cached });
      return;
    }

    // 2) Fetch fallback (for new items added after warmup)
    (async () => {
      try {
        setTipsState({ loading: true, error: null, tips: null });

        const category = inferCategory(top.product);
        const vendor = top.product?.vendor ?? top.product?.brand ?? top.product?.product?.vendor;
        const variantTitle = top.product?.variantTitle ?? top.product?.selectedVariant?.title;

        const item = {
          id: String(top.product?.id ?? top.product?.productId ?? top.product?.handle ?? "unknown"),
          title: top.product?.title ?? top.product?.product?.title ?? "Untitled product",
          quantity: 1,
          variantTitle,
          productType: top.product?.productType ?? top.product?.product?.productType ?? category,
          tags: [
            ...(Array.isArray(top.product?.tags) ? top.product.tags : []),
            ...(Array.isArray(top.product?.product?.tags) ? top.product.product.tags : []),
            `category:${category}`,
            vendor ? `brand:${vendor}` : null,
            variantTitle ? `variant:${variantTitle}` : null,
          ].filter(Boolean),
        };

        const context = {
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

        const tips = await buildCartTipsClient([item], context);
        if (!cancelled) {
          tipsCache.set(top.key, tips ?? null);
          setTipsState({ loading: false, error: null, tips: tips ?? null });
        }
      } catch {
        if (!cancelled) setTipsState({ loading: false, error: "Couldn’t load tips.", tips: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [top]);

  return (
    <>
      <style>{`
        html {
          background-color: #242331 !important;
          min-height: 100%;
          overscroll-behavior: none;
        }
        
        body {
          overflow-x: hidden;
          max-width: 100vw;
          background-color: #242331 !important;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
        
        #root {
          background-color: #242331;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: none;
        }

        /* Enhanced Glassmorphism Animations */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.25); }
        }

        .animated-bg {
          background: linear-gradient(-45deg, #242331, #1d4763ff, #242331, #18415dff);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        
        .floating-element {
          animation: float 6s ease-in-out infinite;
        }
        
        .glow-effect {
          animation: glow 4s ease-in-out infinite;
        }

        .glass-morphism {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        /* Glass morphism dock icons */
        .dock-icon {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .dock-icon:hover {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* Tips panel glassmorphism styling */
        .tips-panel {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
      `}</style>
      <div className="relative min-h-screen animated-bg">
      {/* Header */}
      <div className="pt-12 px-4 pb-6 flex items-center justify-between">
        <button 
          onClick={onBack} 
          className="flex items-center justify-center w-10 h-10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <span className="text-xl">←</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Gear Up & Go</h1>
        <button
          onClick={clear}
          className="text-sm text-gray-300 hover:text-white border border-white/20 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm hover:bg-white/20 transition-all duration-200"
        >
          Clear all
        </button>
      </div>

      {/* Always-visible dock icons */}
      <motion.div
        ref={leftRef}
        className="fixed left-5 top-1/2 -translate-y-1/2 z-[1000] w-15 h-15 rounded-full
                   dock-icon floating-element
                   flex items-center justify-center"
        animate={
          pulseSide === "left"
            ? { scale: [1, 1.25, 1] }
            : { scale: hoverSide === "left" ? 1.1 : 1 }
        }
        transition={{ duration: pulseSide === "left" ? 0.22 : 0.15 }}
      >
        <TrashIcon className="w-7 h-7 text-red-400" />
      </motion.div>

      <motion.div
        ref={rightRef}
        className="fixed right-5 top-1/2 -translate-y-1/2 z-[1000] w-15 h-15 rounded-full
                   dock-icon floating-element glow-effect
                   flex items-center justify-center"
        animate={
          pulseSide === "right"
            ? { scale: [1, 1.25, 1] }
            : { scale: hoverSide === "right" ? 1.1 : 1 }
        }
        transition={{ duration: pulseSide === "right" ? 0.22 : 0.15 }}
      >
        <CartIcon className="w-7 h-7 text-emerald-400" />
      </motion.div>

      {/* Empty vs stack + inline tips just beneath */}
      {items.length === 0 ? (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm text-center">
          <div className="glass-morphism rounded-2xl p-8">
            <div className="mb-4 text-4xl">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">Your gear collection is empty</h3>
            <p className="text-sm text-gray-300">
              Long-press items on the recommendations page to add them to your vision board.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2
                     flex flex-col items-center"
        >
          <SwipeStack
            items={items}
            keyExtractor={keyOf}
            width={220}
            gapY={12}
            gapScale={0.05}
            dismissOffset={120}
            dismissVelocity={700}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onTopChange={setTop}
            dropTargets={{
              getRects,
              onHover: setHoverSide,
              onDropPulse: triggerPulse,
              hoverPadding: 24,
            }}
          />

          {/* ▼▼▼ Collapsible TIPS box ▼▼▼ */}
          <AnimatePresence mode="popLayout">
            {top && (
              <motion.section
                key={top.key}
                initial={{ opacity: 0, y: TIPS_OFFSET_Y + 8, scale: 0.98 }}
                animate={{ opacity: 1, y: TIPS_OFFSET_Y, scale: 1 }}
                exit={{ opacity: 0, y: Math.max(TIPS_OFFSET_Y - 6, 0), scale: 0.99 }}
                transition={{ duration: 0.22 }}
                className="
                  relative z-[900] -mt-20
                  w-[260px] max-w-[92vw]         /* a little wider than the 220px card */
                  rounded-2xl tips-panel
                  px-3 pt-2 pb-2
                "
              >
                {/* Header row: 'TIPS FOR ___' + chevron toggle (only arrow toggles) */}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wide text-gray-300">
                    TIPS FOR{" "}
                    <span className="font-semibold text-white truncate inline-block max-w-[160px] align-bottom">
                      {top.product?.title ?? top.product?.product?.title ?? "this item"}
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-label={tipsOpen ? "Collapse tips" : "Expand tips"}
                    aria-expanded={tipsOpen}
                    onClick={() => setTipsOpen((v) => !v)}
                    className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md
                               hover:bg-white/10 active:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    <motion.span
                      initial={false}
                      animate={{ rotate: tipsOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="block"
                    >
                      <ChevronDown className="h-4 w-4 text-gray-200" />
                    </motion.span>
                  </button>
                </div>

                {/* Collapsible content */}
                <motion.div
                  initial={false}
                  animate={{ height: tipsOpen ? "auto" : 0, opacity: tipsOpen ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                  className="mt-2"
                >
                  {tipsState.loading ? (
                    <div className="flex items-center justify-center h-7 text-[11px] text-gray-300">
                      Generating ideas…
                    </div>
                  ) : tipsState.error ? (
                    <div className="text-[11px] text-red-400">{tipsState.error}</div>
                  ) : tipsState.tips && Array.isArray(tipsState.tips.tips) && tipsState.tips.tips.length > 0 ? (
                    <ol className="list-decimal pl-5 space-y-1.5 max-h-[28vh] overflow-auto pr-1">
                      {tipsState.tips.tips.slice(0, 3).map((raw: any, i: number) => {
                        const t = normalizeTip(raw);
                        return (
                          <li key={i} className="text-[12.5px] leading-snug text-white">
                            <div className="font-medium">{t.title}</div>
                            {t.bullets.length > 0 && (
                              <ul className="mt-0.5 list-disc pl-4 space-y-0.5">
                                {t.bullets.map((b, j) => (
                                  <li key={j} className="text-[11.5px] text-gray-300 leading-snug">
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <div className="text-[11px] text-gray-400">No tips for this product yet.</div>
                  )}
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>
          {/* ▲▲▲ Collapsible TIPS box ▲▲▲ */}
        </div>
      )}
    </div>
    </>
  );
}

/* ───────────────────────────── Icons ───────────────────────────── */

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m3 0V5a2 2 0 0 1 2-2h4a2 2 0 1 1 2 2v2M4 7h16"
      />
    </svg>
  );
}
function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13l-2-8M7 13l-1.5 6H19M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM21 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
      />
    </svg>
  );
}

/* Chevron icon (inline, no extra deps) */
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.14l3.71-2.91a.75.75 0 111.04 1.08l-4.24 3.33a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z" clipRule="evenodd" />
    </svg>
  );
}
