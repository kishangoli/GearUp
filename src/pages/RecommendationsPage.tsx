import React from "react";
import { useProductSearch, ProductCard } from "@shopify/shop-minis-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

import { motion, AnimatePresence } from "framer-motion";
import { useUserAnswers } from "../context/UserAnswersContext";
import { generatePromptBlurbsClient } from "../lib/fal";
import { useVisionBoard } from "../context/VisionBoardContext";
import LongPressToAdd from "../components/ui/LongPressToAdd";

type Prompt = { label: string; query: string };

interface RecommendationsPageProps {
  onBack: () => void;
  plan: { prompts: Prompt[] } | null;
  loading?: boolean;
  footerCta?: { label: string; onClick: () => void };
  onViewVisionBoard?: () => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  onBack,
  plan,
  loading,
  footerCta,
  onViewVisionBoard,
}) => {
  const { items } = useVisionBoard();
  const { answers } = useUserAnswers();

  // ---------- one-liner blurbs ----------
  const [blurbs, setBlurbs] = React.useState<Record<string, string>>({});
  const [blurbsLoading, setBlurbsLoading] = React.useState(false);
  const promptsKey = React.useMemo(
    () => JSON.stringify((plan?.prompts ?? []).map((p) => [p.label, p.query])),
    [plan]
  );

  // ---------- global "added" toast ----------
  const [addedToast, setAddedToast] = React.useState(false);
  const notifyAdded = React.useCallback(() => {
    setAddedToast(true);
    const t = setTimeout(() => setAddedToast(false), 1100);
    return () => clearTimeout(t);
  }, []);

  // ---------- price filter ----------
  const [priceRange, setPriceRange] = React.useState({ min: 0, max: 500 });

  React.useEffect(() => {
    let cancelled = false;
    const prompts = plan?.prompts ?? [];
    if (!prompts.length) {
      setBlurbs({});
      return;
    }
    setBlurbsLoading(true);
    generatePromptBlurbsClient(prompts, answers)
      .then((m) => { if (!cancelled) setBlurbs(m); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBlurbsLoading(false); });
    return () => { cancelled = true; };
  }, [promptsKey, answers]);

  return (
    <>
      <style>{`
        /* More comprehensive ProductCard text color overrides */
        .shopify-product-card *,
        .shopify-product-card h1,
        .shopify-product-card h2,
        .shopify-product-card h3,
        .shopify-product-card h4,
        .shopify-product-card h5,
        .shopify-product-card h6,
        .shopify-product-card p,
        .shopify-product-card span,
        .shopify-product-card div,
        .shopify-product-card .product-title,
        .shopify-product-card [class*="title"],
        .shopify-product-card [class*="name"],
        .shopify-product-card [class*="text"],
        .shopify-product-card [class*="label"],
        [data-testid*="product"] *,
        [class*="product-card"] *,
        [class*="ProductCard"] * {
          color: white !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }
        
        /* Specific price styling */
        .shopify-product-card .price,
        .shopify-product-card [class*="price"],
        .shopify-product-card [class*="Price"],
        [data-testid*="price"] *,
        [class*="product-card"] [class*="price"] * {
          color: #10b981 !important;
          font-weight: 600 !important;
        }
        
        /* Force all text content to be white */
        .embla__slide * {
          color: white !important;
        }
        
        /* Override any inherited dark colors */
        .embla__slide h1, .embla__slide h2, .embla__slide h3, 
        .embla__slide h4, .embla__slide h5, .embla__slide h6,
        .embla__slide p, .embla__slide span, .embla__slide div {
          color: white !important;
        }
        
        /* Custom Range Slider Styles - Updated for modern dual range */
        .slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          pointer-events: none;
        }
        
        .slider::-webkit-slider-track {
          background: transparent;
          height: 4px;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: white;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
          position: relative;
        }
        
        .slider::-moz-range-track {
          background: transparent;
          height: 4px;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          background: white;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
        }
        
        /* Focus states for accessibility */
        .slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .slider:focus::-moz-range-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 pb-20">
      {/* GLOBAL TOAST (top-center) */}
      <AnimatePresence>
        {addedToast && (
            <motion.div
            key="added-toast"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="fixed left-1/2 -translate-x-1/2 top-4 z-[70]"
            aria-live="polite"
            >
            <div className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold shadow-lg ring-1 ring-green-500/30">
                Added to vision board
            </div>
            </motion.div>
        )}
        </AnimatePresence>

      <div className="pt-12 px-4 pb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <span className="text-xl">←</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Your Recommendations</h1>
        <div className="w-10" /> {/* Spacer for center alignment */}
      </div>

      {/* Integrated Price Filter */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-300">Price Range</span>
          <span className="text-sm text-gray-400">${priceRange.min} - ${priceRange.max}</span>
        </div>
        
        {/* Dual Range Slider Container */}
        <div className="relative">
          <div className="flex gap-4 items-center">
            {/* Min/Max Input Fields */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>$</span>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-16 bg-transparent border-b border-gray-600 text-white text-center focus:border-blue-400 focus:outline-none"
                min="0"
                max="1000"
              />
            </div>
            
            {/* Range Slider */}
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ 
                  ...prev, 
                  min: Math.min(parseInt(e.target.value), prev.max - 10) 
                }))}
                className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider z-10"
              />
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ 
                  ...prev, 
                  max: Math.max(parseInt(e.target.value), prev.min + 10) 
                }))}
                className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider z-20"
              />
              <div className="relative h-1 bg-gray-600 rounded-full">
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  style={{
                    left: `${(priceRange.min / 1000) * 100}%`,
                    width: `${((priceRange.max - priceRange.min) / 1000) * 100}%`
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>$</span>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: Math.min(1000, parseInt(e.target.value) || 1000) }))}
                className="w-16 bg-transparent border-b border-gray-600 text-white text-center focus:border-blue-400 focus:outline-none"
                min="0"
                max="1000"
              />
            </div>
          </div>
        </div>
        
        {/* Quick preset buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setPriceRange({ min: 0, max: 100 })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              priceRange.min === 0 && priceRange.max === 100
                ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
            }`}
          >
            Under $100
          </button>
          <button
            onClick={() => setPriceRange({ min: 100, max: 300 })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              priceRange.min === 100 && priceRange.max === 300
                ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
            }`}
          >
            $100-$300
          </button>
          <button
            onClick={() => setPriceRange({ min: 300, max: 1000 })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              priceRange.min === 300 && priceRange.max === 1000
                ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
            }`}
          >
            $300+
          </button>
        </div>
      </div>

        <div className="px-4 pb-10 space-y-6">
          {loading && <SkeletonSection />}

          {!loading && plan && plan.prompts.length === 0 && (
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 text-gray-300">
              No prompts yet. Try adjusting your answers.
            </div>
          )}


        {!loading &&
          plan?.prompts.map((p, idx) => (
            <PromptRow
              key={`${p.label}-${idx}`}
              prompt={p}
              blurb={blurbsLoading ? "__loading__" : (blurbs[p.label] ?? "")}
              onAnyItemAdded={notifyAdded}
              priceFilter={priceRange}
            />
          ))}
      </div>

      {(items.length > 0 || footerCta) && (
        <div className="fixed left-0 right-0 bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-slate-900/90 via-slate-800/50 to-transparent backdrop-blur">
          <div className="flex gap-2">
            {onViewVisionBoard && items.length > 0 && (
              <button
                onClick={onViewVisionBoard}
                className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                View vision board ({items.length})
              </button>
            )}
            {footerCta && (
              <button
                onClick={footerCta.onClick}
                className="h-12 px-4 rounded-xl border border-slate-600 bg-slate-700 text-gray-300 font-medium shadow-sm hover:bg-slate-600"
              >
                {footerCta.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

/* ----------------------------- Prompt Row ----------------------------- */

const PromptRow: React.FC<{
  prompt: Prompt;
  blurb?: string;
  onAnyItemAdded: () => void;
  priceFilter: { min: number; max: number };
}> = ({ prompt, blurb, onAnyItemAdded, priceFilter }) => {
  const [fetchCount, setFetchCount] = React.useState(20);
  const raw: any = useProductSearch({ query: prompt.query, first: fetchCount });

  const [emblaRef] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
      containScroll: 'trimSnaps',
      dragFree: true
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  const isLoading =
    typeof raw?.isLoading === "boolean" ? raw.isLoading :
    typeof raw?.loading === "boolean" ? raw.loading : false;

  const error = raw?.error ?? null;

  const results: any[] =
    Array.isArray(raw?.data) ? raw.data :
    Array.isArray(raw?.results) ? raw.results :
    Array.isArray(raw?.items) ? raw.items :
    Array.isArray(raw?.products) ? raw.products :
    Array.isArray(raw?.nodes) ? raw.nodes :
    Array.isArray(raw?.edges) ? raw.edges.map((e: any) => e?.node ?? e) :
    [];

  // local list so we can remove cards after add
  const idOf = (p: any, idx?: number) => String(p?.id ?? p?.productId ?? p?.handle ?? idx ?? Math.random());
  const resultsSig = React.useMemo(
    () => JSON.stringify(results.map((p, i) => idOf(p, i))),
    [results]
  );
  const [products, setProducts] = React.useState<any[]>([]);
  React.useEffect(() => {
    setProducts(results);
  }, [resultsSig]);

  // Filter products by price
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      // Extract price from product - handle different price formats
      const priceStr = product.price?.amount || product.priceRange?.minVariantPrice?.amount || product.variants?.edges?.[0]?.node?.price?.amount || '0';
      const price = parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
      
      return price >= priceFilter.min && price <= priceFilter.max;
    });
  }, [products, priceFilter]);

  // Auto-fetch more products if filtered list is too small
  React.useEffect(() => {
    // Super aggressive fetching: keep fetching until we have at least 10 visible products
    if (!isLoading && products.length > 0 && filteredProducts.length < 10 && fetchCount < 100) {
      const nextFetchCount = Math.min(fetchCount + 20, 100); // Increase by 20, max 100
      setFetchCount(nextFetchCount);
    }
  }, [filteredProducts.length, products.length, isLoading, fetchCount]);

  // Reset fetch count when price filter changes significantly
  React.useEffect(() => {
    // Reset to higher base count when price range changes
    setFetchCount(20); // Start with 20 instead of 15
  }, [priceFilter.min, priceFilter.max]);

  const removeById = (id: string) => {
    setProducts((prev) => prev.filter((p, i) => idOf(p, i) !== id));
  };

  const fallbackBlurb = `Curated picks to help you shop ${prompt.label.toLowerCase()}.`;

  return (
    <section className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 ring-1 ring-white/10">

      <h2 className="text-lg font-semibold text-white">{prompt.label}</h2>

      {blurb === "__loading__" ? (
        <div className="h-3 w-52 bg-slate-600 rounded mt-2 mb-6 animate-pulse" />
      ) : (
        <p className="text-sm text-gray-300 mt-1 mb-6">{blurb || fallbackBlurb}</p>
      )}

      <p className="sr-only">
        Query: <span className="font-mono">{prompt.query}</span>
      </p>

      {isLoading && <SkeletonCarousel />}

      {!isLoading && error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          Couldn’t load products for this prompt. Try again.
        </div>
      )}

      {!isLoading && !error && (
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex gap-3">
            <AnimatePresence>
              {filteredProducts.map((prod, i) => {
                const key = idOf(prod, i);
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.8 }}
                    className="embla__slide flex-[0_0_50%] min-w-0"
                  >
                    <LongPressToAdd
                      product={prod}
                      onAdded={() => {
                        removeById(key);
                        onAnyItemAdded();
                      }}
                    >
                      <ProductCard product={prod} />
                    </LongPressToAdd>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredProducts.length === 0 && (
              <div className="w-full text-sm text-gray-400 border border-slate-600 bg-slate-800/50 rounded-xl p-4">
                {products.length === 0 ? "No results matched this query." : "No products found in this price range."}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

/* ----------------------------- Skeletons ----------------------------- */

const SkeletonSection = () => (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 ring-1 ring-white/10">
      <div className="animate-pulse h-5 w-40 bg-slate-600 rounded mb-4" />
      <SkeletonCarousel />
    </div>
  );
  
const SkeletonCarousel = () => (
  <div className="flex gap-3 overflow-hidden">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex-[0_0_50%] h-44 rounded-xl bg-slate-700/60 border border-slate-600 animate-pulse" />
    ))}
  </div>
);