import React from "react";
import SwipeStack from "../ui/SwipeStack";
import { useVisionBoard } from "../context/VisionBoardContext";
import { useShopCartActions, useShopNavigation, Button } from "@shopify/shop-minis-react";
import { motion, AnimatePresence } from "motion/react";
import { buildCartTipsClient } from "../fal-usage/fal";
import { tipsCache } from "../../cache/tipsCache";           // shared cache filled by Warmup
import { inferCategory } from "../utils/tipsPrefetch";     // same rules as warmup


/* ───────────────────────────── Helpers ───────────────────────────── */

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
  const { navigateToCart } = useShopNavigation(); // New hook for cart navigation
  const [hasAddedToCart, setHasAddedToCart] = React.useState(false);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [allItemsProcessed, setAllItemsProcessed] = React.useState(false);

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
    // Check if all items have been processed
    if (items.length === 1) { // This will be the last item after removal
      setAllItemsProcessed(true);
    }
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
      // Add to cart in the background
      await addToCart({ productId, productVariantId, quantity: 1 });
      setHasAddedToCart(true); // 👈 Track that we've added something to cart
      setCartItemCount(prev => prev + 1); // 👈 Increment cart counter
    } catch (error) {
      // Silently handle cart addition failure
      console.warn('Failed to add item to cart:', error);
    }

    // Check if all items have been processed
    if (items.length === 1) { // This will be the last item after removal
      setAllItemsProcessed(true);
    }
  };

  /* ── Tips for the top product ── */
  const [top, setTop] = React.useState<{ key: string; product: any } | null>(null);
  const [tipsState, setTipsState] = React.useState<{
    loading: boolean;
    error: string | null;
    tips: any | null;
  }>({ loading: false, error: null, tips: null });

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

        /* Toast Animations */
        @keyframes hide {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-100%);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes swipeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-100%);
          }
        }

        .animate-hide {
          animation: hide 200ms ease-in forwards;
        }

        .animate-slideIn {
          animation: slideIn 300ms ease-out forwards;
        }

        .animate-swipeOut {
          animation: swipeOut 200ms ease-out forwards;
        }

        /* Toast Animations */
        @keyframes toast-hide {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(100%);
          }
        }

        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes toast-swipe-out {
          from {
            transform: translateY(var(--radix-toast-swipe-end-y));
          }
          to {
            transform: translateY(100%);
          }
        }

        .animate-toast-hide {
          animation: toast-hide 200ms ease-in forwards;
        }

        .animate-toast-slide-in {
          animation: toast-slide-in 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-toast-swipe-out {
          animation: toast-swipe-out 200ms ease-out forwards;
        }

        /* Add this style for the cart button */
        .cart-button {
          background: rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 
            0 8px 32px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          animation: glow 4s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        
        .cart-button:active {
          transform: scale(0.98);
        }

        /* FAB Cart Button Styles */
        .fab-cart {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          box-shadow: 
            0 10px 25px rgba(59, 130, 246, 0.4),
            0 4px 12px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .fab-cart:hover {
          box-shadow: 
            0 15px 35px rgba(59, 130, 246, 0.5),
            0 6px 16px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        /* Ultra-aggressive Shopify FAB hiding - targets all possible selectors */
        html [data-shop-mini-cart-fab],
        html .shop-mini-cart-fab,
        html .shopify-cart-fab,
        html .cart-fab,
        html .mini-cart-fab,
        html button[aria-label*="cart" i][style*="fixed"],
        html button[class*="cart"][style*="fixed"],
        html div[class*="cart-fab"],
        html div[data-testid*="cart"],
        html .floating-cart-button,
        html .cart-floating-button,
        html shop-mini-cart-fab,
        html .shop-mini-cart-wrapper [role="button"],
        html .shop-mini-floating-cart,
        html [class*="ShopMini"][class*="Cart"],
        html [class*="FloatingCart"],
        html [data-shop-mini="true"] button[style*="position: fixed"],
        html button[style*="background-color: rgb(98, 77, 227)"],
        html button[style*="background: rgb(98, 77, 227)"],
        html div[style*="background-color: rgb(98, 77, 227)"],
        html div[style*="background: rgb(98, 77, 227)"],
        html button[style*="position: fixed"][style*="bottom"][style*="right"]:not([class*="custom-fab"]),
        html div[style*="position: fixed"][style*="bottom"][style*="right"][role="button"],
        /* Target by common Shopify Mini patterns */
        html [id*="shop-mini"],
        html [class*="shop-mini"],
        html [data-shopify*="cart"],
        html button[style*="z-index"][style*="fixed"]:not([class*="custom-fab"]),
        /* Catch-all for bottom-right fixed buttons that aren't ours */
        html body > * button[style*="position: fixed"][style*="bottom"]:not([class*="custom-fab"]),
        html body > div > * button[style*="position: fixed"][style*="bottom"]:not([class*="custom-fab"]) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -9999 !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      <div className="relative min-h-screen animated-bg">
        
          {/* Sticky Back Button */}
          <div className="fixed top-4 left-4 z-50">
            <Button 
              onClick={onBack} 
              className="flex items-center justify-center w-12 h-12 text-white hover:text-gray-300 transition-all duration-200"
            >
              <span className="text-xl">←</span>
            </Button>
          </div>

          {/* Header */}
          <div className="pt-12 px-4 pb-6 flex items-center justify-between">
            <div className="w-10" /> {/* Spacer for centering */}
            <h1 className="text-2xl font-bold text-white flex items-center">Gear Up & Go</h1>
            <Button
              onClick={clear}
              className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
            >
              Clear
            </Button>
          </div>

          {/* Always-visible dock icons */}
          <div>
            <motion.div
              ref={leftRef}
              className="fixed left-3 top-[35%] -translate-y-1/2 z-[1000]
                        trash-icon floating-element
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
              className="fixed right-3 top-[35%] -translate-y-1/2 z-[1000]
                        cart-icon floating-element
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
          </div>

          {/* Empty vs stack + inline tips just beneath */}
          {items.length === 0 ? (
            <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2">
              {/* Empty state card matching regular content card size */}
              <div 
                className="bg-gray-400/20 backdrop-blur-sm rounded-xl border border-gray-400/30"
                style={{ 
                  width: 220, 
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div className="text-gray-400/60 text-4xl">∅</div>
              </div>
            </div>
          ) : (
            <div
              className="absolute left-1/2 top-[15%] -translate-x-1/2 -translate-y-1/2
                        flex flex-col items-center"
            >
              <div 
                className="transition-all duration-300"
                style={{ 
                  // Ensure the animation container has proper styling
                  position: 'relative',
                  zIndex: 10 
                }}
              >
                <SwipeStack
                  items={items.slice(0, 4)} // Show max 5 cards to reduce clutter
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
              </div>

            </div>
          )}

          {/* ▼▼▼ Always-visible TIPS section or completion actions ▼▼▼ */}
          <AnimatePresence mode="popLayout">
            {items.length === 0 && !allItemsProcessed ? (
              <motion.section
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.22 }}
                className="
                  fixed bottom-50 left-0 right-0 z-[900]
                  w-screen px-6
                  py-2
                "
              >
                <div className="max-w-xs mx-auto text-center">
                  <div className="text-sm text-gray-300 leading-relaxed">
                    Your gear collection is empty.
                    <br />
                    <Button 
                      onClick={onBack}
                      className="text-white font-medium hover:text-blue-300 transition-colors duration-200 cursor-pointer underline"
                    >
                      Go back to add more gear!
                    </Button>
                  </div>
                </div>
              </motion.section>
            ) : allItemsProcessed && hasAddedToCart ? (
              <motion.section
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.22 }}
                className="
                  fixed bottom-8 left-0 right-0 z-[900]
                  w-screen px-6 py-6
                "
              >
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white mb-2">
                      🎉 Selection Complete!
                    </div>
                    <div className="text-sm text-gray-300">
                      You've added {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} to your cart
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={onBack}
                      className="
                        flex-1 py-3 px-4 rounded-xl
                        bg-gray-600/30 hover:bg-gray-600/50
                        text-white font-medium
                        border border-gray-500/30
                        transition-all duration-200
                      "
                    >
                      Add More Gear
                    </Button>
                    
                    <Button
                      onClick={() => navigateToCart()}
                      className="
                        flex-1 py-3 px-4 rounded-xl
                        bg-gradient-to-r from-blue-500 to-blue-600
                        hover:from-blue-400 hover:to-blue-500
                        text-white font-semibold
                        shadow-lg hover:shadow-xl
                        transform hover:scale-[1.02] active:scale-[0.98]
                        transition-all duration-200
                        glow-effect
                      "
                    >
                      Go to Cart ({cartItemCount})
                    </Button>
                  </div>
                </div>
              </motion.section>
            ) : allItemsProcessed && !hasAddedToCart ? (
              <motion.section
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.22 }}
                className="
                  fixed bottom-16 left-0 right-0 z-[900]
                  w-screen px-6 py-6
                "
              >
                <div className="max-w-xs mx-auto text-center">
                  <div className="text-lg font-medium text-white mb-3">
                    No items added to cart
                  </div>
                  <Button
                    onClick={onBack}
                    className="
                      w-full py-3 px-4 rounded-xl
                      bg-gradient-to-r from-blue-500 to-blue-600
                      hover:from-blue-400 hover:to-blue-500
                      text-white font-semibold
                      shadow-lg hover:shadow-xl
                      transform hover:scale-[1.02] active:scale-[0.98]
                      transition-all duration-200
                      glow-effect
                    "
                  >
                    Browse More Gear
                  </Button>
                </div>
              </motion.section>
            ) : top && (
              <motion.section
                key={top.key}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.22 }}
                className="
                  fixed bottom-13 left-0 right-0 z-[900]
                  w-screen px-6
                  py-2
                "
              >
                {/* Header row: 'Tips & Tricks' */}
                <div className="flex items-center justify-center mb-3">
                  <div className="text-xs uppercase tracking-wider text-gray-300 text-center font-medium">
                    Tips & Tricks
                  </div>
                </div>

                {/* Always-visible content */}
                <div className="max-w-sm mx-auto flex-1 flex flex-col">
                  {tipsState.loading ? (
                    <div className="flex items-center justify-center flex-1 text-xs text-gray-300">
                      <div className="animate-pulse">Generating ideas…</div>
                    </div>
                  ) : tipsState.error ? (
                    <div className="text-xs text-red-400 text-center flex-1 flex items-center justify-center">{tipsState.error}</div>
                  ) : tipsState.tips && Array.isArray(tipsState.tips.tips) && tipsState.tips.tips.length > 0 ? (
                    <div className="space-y-1.5 flex-1 flex flex-col">
                      {tipsState.tips.tips.slice(0, 3).map((raw: any, i: number) => {
                        const t = normalizeTip(raw);
                        return (
                          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20 flex-1 flex flex-col justify-center">
                            <div className="text-xs font-semibold text-white mb-1 leading-tight text-center">
                              {i + 1}. {t.title}
                            </div>
                            {t.bullets.length > 0 && (
                              <div className="space-y-0.5 mt-1">
                                {t.bullets.map((b, j) => (
                                  <div key={j} className="text-[10px] text-gray-300 leading-relaxed text-center">
                                    • {b}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center flex-1 flex items-center justify-center">No tips for this product yet.</div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
          {/* ▲▲▲ Always-visible TIPS section ▲▲▲ */}

          
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
        d="M19 7l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m3 0V5a2 2 0 0 1 2-2h4a2 2 0 1 1-2 2v2M4 7h16"
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
