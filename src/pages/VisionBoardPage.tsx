import React from "react";
import SwipeStack from "../components/ui/SwipeStack";
import { useVisionBoard } from "../context/VisionBoardContext";
import { useShopCartActions } from "@shopify/shop-minis-react";
import { motion } from "framer-motion";

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

  // ---- Add-to-cart ids (right drop/swipe) ---------------------------------
  const pickIds = (p: any) => {
    const productId =
      p?.id ?? p?.productId ?? p?.gid ?? p?.product?.id ?? p?.product?.gid;
    const variant =
      p?.selectedVariant ??
      p?.variant ??
      p?.variants?.[0] ??
      p?.variants?.nodes?.[0] ??
      p?.variants?.edges?.[0]?.node ??
      p?.productVariants?.[0] ??
      p?.defaultVariant ??
      p?.firstAvailableVariant;
    const productVariantId =
      variant?.id ?? variant?.gid ?? variant?.productVariantId ?? variant?.variantId;
    return { productId, productVariantId };
  };
  // -------------------------------------------------------------------------

  const handleSwipeLeft = async (key: string) => {
    remove(key);
  };

  const handleSwipeRight = async (key: string) => {
    // remove from board immediately so empty-state updates even if cart fails
    remove(key);

    // best-effort add-to-cart
    const idx = items.findIndex((p, i) => keyOf(p, i) === key);
    if (idx === -1) return;
    const product = items[idx];
    const { productId, productVariantId } = pickIds(product);
    if (!productId || !productVariantId) return;
    try {
      await addToCart({ productId, productVariantId, quantity: 1 });
    } catch (e) {
      // non-blocking; item already removed per your spec
      console.warn("addToCart failed:", e);
    }
  };

  // ---- Dock icons state ----------------------------------------------------
  const leftRef = React.useRef<HTMLDivElement>(null);
  const rightRef = React.useRef<HTMLDivElement>(null);

  const [hoverSide, setHoverSide] = React.useState<"left" | "right" | null>(null);
  const [pulseSide, setPulseSide] = React.useState<"left" | "right" | null>(null);

  const getRects = React.useCallback(() => {
    return {
      left: leftRef.current?.getBoundingClientRect() ?? null,
      right: rightRef.current?.getBoundingClientRect() ?? null,
    };
  }, []);

  const triggerPulse = (side: "left" | "right") => {
    setPulseSide(side);
    window.setTimeout(() => setPulseSide((s) => (s === side ? null : s)), 220);
  };
  // -------------------------------------------------------------------------

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

        /* Fix image distortion in vision board product cards */
        .shopify-product-card img,
        .shopify-product-card picture img,
        [class*="product-card"] img,
        [class*="ProductCard"] img,
        [data-testid*="product"] img {
          object-fit: cover !important;
          object-position: center !important;
          width: 100% !important;
          height: auto !important;
          aspect-ratio: 1 / 1 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }

        /* Ensure product card containers maintain proper aspect ratio */
        .shopify-product-card,
        [class*="product-card"],
        [class*="ProductCard"] {
          aspect-ratio: auto !important;
          height: auto !important;
          min-height: 180px !important;
          max-height: 220px !important;
          overflow: hidden !important;
          border-radius: 12px !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Fix image containers within product cards */
        .shopify-product-card > div:first-child,
        .shopify-product-card picture,
        .shopify-product-card figure,
        [class*="product-card"] > div:first-child,
        [class*="ProductCard"] > div:first-child {
          aspect-ratio: 1 / 1 !important;
          overflow: hidden !important;
          border-radius: 8px !important;
          background: #f8fafc !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
        }

        /* Ensure text content below images doesn't stretch */
        .shopify-product-card > div:not(:first-child),
        [class*="product-card"] > div:not(:first-child),
        [class*="ProductCard"] > div:not(:first-child) {
          flex: 1 !important;
          padding: 8px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }

        /* Prevent text from affecting image layout */
        .shopify-product-card h1,
        .shopify-product-card h2,
        .shopify-product-card h3,
        .shopify-product-card p,
        .shopify-product-card span,
        [class*="product-card"] h1,
        [class*="product-card"] h2,
        [class*="product-card"] h3,
        [class*="product-card"] p,
        [class*="product-card"] span {
          line-height: 1.2 !important;
          margin: 0 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          color: #1f2937 !important;
        }

        /* Vision board specific improvements */
        .vision-board-card {
          width: 100% !important;
          max-width: 220px !important;
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

      {/* Empty state vs stack */}
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
        <div className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2">
          <SwipeStack
            items={items}
            keyExtractor={keyOf}
            width={220}
            gapY={12}
            gapScale={0.05}
            dismissOffset={120}
            dismissVelocity={700}
            onSwipeLeft={handleSwipeLeft}     // remove
            onSwipeRight={handleSwipeRight}   // add to cart + remove
            dropTargets={{
              getRects,
              onHover: setHoverSide,
              onDropPulse: triggerPulse,
              hoverPadding: 24, // px around the icon to start the hover enlarge
            }}
          />
        </div>
      )}
    </div>
    </>
  );
}

/* ——— inline icons to avoid new deps ——— */
function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M19 7l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m3 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 7h16" />
    </svg>
  );
}
function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13l-2-8M7 13l-1.5 6H19M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
    </svg>
  );
}
