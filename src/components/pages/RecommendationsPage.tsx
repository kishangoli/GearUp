import React from "react";
import { useProductSearch, ProductCard } from "@shopify/shop-minis-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useLongPress } from "use-long-press";

import { motion, AnimatePresence } from "framer-motion";
import { useUserAnswers } from "../context/UserAnswersContext";
import { generatePromptBlurbsClient } from "../fal-usage/fal";
import { useVisionBoard } from "../context/VisionBoardContext";
import LongPressToAdd from "../ui/LongPressToAdd";

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
  const [flyingItems, setFlyingItems] = React.useState<Array<{
    id: string;
    startX: number;
    startY: number;
    product: any;
  }>>([]);

  const notifyAdded = React.useCallback((product: any, element: HTMLElement | null) => {
    if (element) {
      // Get the element's position
      const rect = element.getBoundingClientRect();
      const flyingId = `flying-${Date.now()}-${Math.random()}`;
      
      // Add glow effect to the Review Your Gear button
      const button = document.querySelector('[data-review-gear-button]');
      if (button) {
        button.classList.add('receiving-items');
        setTimeout(() => {
          button.classList.remove('receiving-items');
        }, 1200);
      }
      
      // Add flying item animation
      setFlyingItems(prev => [...prev, {
        id: flyingId,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
        product
      }]);

      // Remove flying item after animation
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== flyingId));
      }, 1200);
    } else {
      // Fallback to toast if no element position available
      setAddedToast(true);
      const t = setTimeout(() => setAddedToast(false), 1100);
      return () => clearTimeout(t);
    }
  }, []);

  // ---------- price filter ----------
  const [priceRange, setPriceRange] = React.useState({ min: 0, max: 1000 });
  const [isPriceFilterExpanded, setIsPriceFilterExpanded] = React.useState(false);

  // ---------- easter egg ----------
  const [showNumberSpam, setShowNumberSpam] = React.useState(false);
  const [numbers, setNumbers] = React.useState<Array<{ id: number; x: number; y: number; number: string }>>([]);

  // ---------- long press announcement ----------
  const [showLongPressAnnouncement, setShowLongPressAnnouncement] = React.useState(false);

  // Show announcement every time they reach recommendations
  React.useEffect(() => {
    if (!loading && plan?.prompts?.length) {
      setTimeout(() => {
        setShowLongPressAnnouncement(true);
      }, 1000); // Show after 1 second delay
    }
  }, [loading, plan]);

  const triggerNumberSpam = React.useCallback(() => {
    setShowNumberSpam(true);
    
    // Generate 50 random 6s and 7s at random positions
    const newNumbers = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      number: Math.random() > 0.5 ? '6' : '7'
    }));
    
    setNumbers(newNumbers);
    
    // Clear after 3 seconds
    setTimeout(() => {
      setShowNumberSpam(false);
      setNumbers([]);
    }, 3000);
  }, []);

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
        
        /* Modern Range Slider Styles */
        .slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          pointer-events: none;
        }
        
        .slider::-webkit-slider-track {
          background: transparent;
          height: 12px;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          height: 24px;
          width: 24px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 0 rgba(59, 130, 246, 0.7);
          pointer-events: auto;
          position: relative;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.8), 0 0 0 8px rgba(59, 130, 246, 0.1);
        }
        
        .slider::-moz-range-track {
          background: transparent;
          height: 12px;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          height: 24px;
          width: 24px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          pointer-events: auto;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }
        
        /* Focus states for accessibility */
        .slider:focus::-webkit-slider-thumb {
          outline: none;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .slider:focus::-moz-range-thumb {
          outline: none;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        /* Fix image distortion in product cards */
        .shopify-product-card img,
        .shopify-product-card picture img,
        .embla__slide img,
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
        .embla__slide > div,
        [class*="product-card"],
        [class*="ProductCard"] {
          aspect-ratio: auto !important;
          height: auto !important;
          min-height: 200px !important;
          max-height: 280px !important;
          overflow: hidden !important;
          border-radius: 12px !important;
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
        }
        
        /* Easter egg number spam animation */
        @keyframes numberFloat {
          0% {
            opacity: 1;
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-100px) rotate(180deg) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) rotate(360deg) scale(0.8);
          }
        }
        
        .number-spam {
          animation: numberFloat 3s ease-out forwards;
          pointer-events: none;
          position: fixed;
          z-index: 9999;
          font-size: 2rem;
          font-weight: bold;
          color: #3b82f6;
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        /* Flying item animation */
        @keyframes flyToGear {
          0% {
            opacity: 1;
            transform: scale(1) rotate(0deg) translateY(0);
          }
          15% {
            opacity: 0.95;
            transform: scale(0.9) rotate(3deg) translateY(400px);
          }
          30% {
            opacity: 0.8;
            transform: scale(0.7) rotate(8deg) translateY(900px);
          }
          45% {
            opacity: 0.6;
            transform: scale(0.5) rotate(15deg) translateY(1500px);
          }
          60% {
            opacity: 0.4;
            transform: scale(0.3) rotate(20deg) translateY(2200px);
          }
          75% {
            opacity: 0.2;
            transform: scale(0.15) rotate(25deg) translateY(3000px);
          }
          90% {
            opacity: 0.05;
            transform: scale(0.05) rotate(30deg) translateY(3800px);
          }
          100% {
            opacity: 0;
            transform: scale(0.02) rotate(35deg) translateY(4500px);
          }
        }
        
        .flying-item {
          animation: flyToGear 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          pointer-events: none;
          position: fixed;
          z-index: 9999;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(59, 130, 246, 0.5);
        }

        /* Button glow effect when items are flying */
        [data-review-gear-button].receiving-items {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3) !important;
          animation: buttonPulse 1.2s ease-in-out;
        }
        
        @keyframes buttonPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        /* Performance optimizations for smooth animations */
        * {
          will-change: auto;
        }
        
        .price-filter-container {
          contain: layout style paint;
        }
        
        /* Optimize motion elements for better performance */
        [data-framer-motion] {
          transform-style: preserve-3d;
          backface-visibility: hidden;
          perspective: 1000px;
        }

        /* Enhanced Embla Carousel Spacing - Edge to Edge */
        .embla {
          overflow: hidden;
        }
        
        .embla__container {
          display: flex;
          margin-left: 0; /* Start from edge */
        }
        
        .embla__slide {
          flex: 0 0 auto;
          padding-left: 16px; /* 16px spacing between slides (equivalent to px-4) */
          min-width: 160px; /* Minimum width to prevent squishing */
          max-width: calc(50% - 8px); /* Maximum 50% width minus half the gap */
        }
        
        .embla__slide:first-child {
          padding-left: 16px; /* First slide starts with padding from edge */
        }
        
        .embla__slide:last-child {
          padding-right: 16px; /* Last slide ends with padding to edge */
        }
        
        /* Ensure product cards don't overflow their containers */
        .embla__slide > * {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        
        /* Prevent layout shifts during animations */
        .embla__slide [data-framer-motion] {
          width: 100%;
          display: block;
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

      {/* Flying Items Animation */}
      {flyingItems.map((item) => {
        // Calculate the target position (center of Review Your Gear button)
        const targetElement = document.querySelector('[data-review-gear-button]');
        const targetRect = targetElement?.getBoundingClientRect();
        
        // If button exists, target its center; otherwise use bottom center as fallback
        const targetX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2;
        const targetY = targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight - 60;

        return (
          <div
            key={item.id}
            className="flying-item"
            style={{
              left: `${item.startX}px`,
              top: `${item.startY}px`,
              width: '60px',
              height: '60px',
              '--target-x': `${targetX - item.startX}px`,
              '--target-y': `${targetY - item.startY}px`,
            } as React.CSSProperties}
          >
            {/* Mini product image */}
            {item.product?.images?.[0]?.url || item.product?.featuredImage?.url ? (
              <img
                src={item.product.images?.[0]?.url || item.product.featuredImage?.url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                📦
              </div>
            )}
          </div>
        );
      })}

      {/* Long Press Announcement Modal */}
      <AnimatePresence>
        {showLongPressAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                delay: 0.1 
              }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-sm w-full p-6 text-center"
            >
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  delay: 0.3 
                }}
                className="mb-4"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <img
                    src="/press_icon.png"
                    alt="Press icon"
                    className="w-8 h-8 object-contain filter brightness-0 invert"
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-bold text-white mb-2"
              >
                Long Press to Add!
              </motion.h3>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-300 text-sm mb-6 leading-relaxed"
              >
                Hold down on any product to watch it fly to your gear collection! 
              </motion.p>

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => setShowLongPressAnnouncement(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 active:scale-95"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Got it! Let's shop
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easter Egg Number Spam */}
      {showNumberSpam && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          {numbers.map((num) => (
            <div
              key={num.id}
              className="number-spam"
              style={{
                left: `${num.x}px`,
                top: `${num.y}px`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            >
              {num.number}
            </div>
          ))}
        </div>
      )}

      {/* Sticky Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-12 h-12 text-white hover:text-gray-300 transition-all duration-200"
        >
          <span className="text-xl">←</span>
        </button>
      </div>

      <div className="pt-12 px-4 pb-6 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-white">Your Recommendations</h1>
      </div>

      {/* Combined Price Filter and Quick Tip Row */}
      <div className="px-4 pb-6 space-y-4 price-filter-container">
        {/* Price Filter */}
        <div className="w-full">
          {/* Collapsed State - Side by side with Quick Tip */}
          {!isPriceFilterExpanded ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex gap-3"
              >
              {/* Price Filter Button - Left Side */}
              <div className="flex-1">
                <motion.button
                  onClick={() => setIsPriceFilterExpanded(true)}
                  className="w-full bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300 group h-[72px] flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg shrink-0">💰</span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-white">Price Range</span>
                        <span className="text-xs font-mono text-gray-400 truncate">
                          ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <motion.span 
                      className="text-gray-400 group-hover:text-white transition-colors shrink-0"
                      animate={{ rotate: isPriceFilterExpanded ? 180 : 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      ▼
                    </motion.span>
                  </div>
                </motion.button>
              </div>

              {/* Quick Tip - Right Side (when collapsed) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex-1"
              >
                <div 
                  {...useLongPress(triggerNumberSpam, {
                    threshold: 500,
                    cancelOnMovement: 15,
                  })()}
                  className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-400/20 cursor-pointer select-none h-[72px] flex items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Quick Tip</p>
                      <p className="text-xs text-blue-300/80">Long press to add to your gear. </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            </AnimatePresence>
          ) : (
            /* Expanded State - Full width */
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut"
                }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="p-6">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💰</span>
                      <h3 className="text-base font-semibold text-white">Price Range</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div 
                        key={`${priceRange.min}-${priceRange.max}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30"
                      >
                        <span className="text-xs font-mono text-white">
                          ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()}
                        </span>
                      </motion.div>
                      <button
                        onClick={() => setIsPriceFilterExpanded(false)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                      >
                        <motion.span
                          animate={{ rotate: 180 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="text-sm"
                        >
                          ▼
                        </motion.span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Modern Dual Range Slider */}
                  <div className="relative mb-6">
                    <div className="flex items-center gap-4">
                      {/* Min Value Display */}
                      <div className="flex flex-col items-center min-w-[50px]">
                        <span className="text-xs text-gray-400 mb-1">Min</span>
                        <div className="px-2 py-1.5 bg-white/10 rounded-lg border border-white/20">
                          <input
                            type="number"
                            value={priceRange.min}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(parseInt(e.target.value) || 0, priceRange.max - 25));
                              setPriceRange(prev => ({ ...prev, min: value }));
                            }}
                            className="w-full text-xs font-medium text-white bg-transparent border-none outline-none text-center"
                            style={{ width: '35px' }}
                            min="0"
                            max="1000"
                          />
                        </div>
                      </div>
                      
                      {/* Enhanced Range Slider - Made bigger for finger use */}
                      <div className="flex-1 relative py-6">
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="25"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ 
                            ...prev, 
                            min: Math.min(parseInt(e.target.value), prev.max - 25) 
                          }))}
                          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer slider z-20"
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="25"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ 
                            ...prev, 
                            max: Math.max(parseInt(e.target.value), prev.min + 25) 
                          }))}
                          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer slider z-10"
                        />
                        
                        {/* Track Background - Made bigger */}
                        <div className="relative h-3 bg-white/10 rounded-full">
                          {/* Active Range */}
                          <motion.div 
                            className="absolute h-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full shadow-lg"
                            style={{
                              left: `${(priceRange.min / 1000) * 100}%`,
                              width: `${((priceRange.max - priceRange.min) / 1000) * 100}%`
                            }}
                            layout
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                          />
                          
                          {/* Glow Effect */}
                          <div 
                            className="absolute h-3 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-pink-400/50 rounded-full blur-sm"
                            style={{
                              left: `${(priceRange.min / 1000) * 100}%`,
                              width: `${((priceRange.max - priceRange.min) / 1000) * 100}%`
                            }}
                          />
                        </div>
                        
                        {/* Value indicators on track */}
                        <div className="absolute -bottom-2 left-0 right-0 flex justify-between text-xs text-gray-500">
                          <span>$0</span>
                          <span>$250</span>
                          <span>$500</span>
                          <span>$750</span>
                          <span>$1K</span>
                        </div>
                      </div>
                      
                      {/* Max Value Display */}
                      <div className="flex flex-col items-center min-w-[50px]">
                        <span className="text-xs text-gray-400 mb-1">Max</span>
                        <div className="px-2 py-1.5 bg-white/10 rounded-lg border border-white/20">
                          <input
                            type="number"
                            value={priceRange.max}
                            onChange={(e) => {
                              const value = Math.min(1000, Math.max(parseInt(e.target.value) || 0, priceRange.min + 25));
                              setPriceRange(prev => ({ ...prev, max: value }));
                            }}
                            className="w-full text-xs font-medium text-white bg-transparent border-none outline-none text-center"
                            style={{ width: '35px' }}
                            min="0"
                            max="1000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Professional Preset Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // If already selected, deselect to "Any Budget"
                        if (priceRange.min === 0 && priceRange.max === 100) {
                          setPriceRange({ min: 0, max: 1000 });
                        } else {
                          setPriceRange({ min: 0, max: 100 });
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        priceRange.min === 0 && priceRange.max === 100
                          ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50 shadow-lg shadow-blue-500/25'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      $0 - $100
                    </button>
                    <button
                      onClick={() => {
                        // If already selected, deselect to "Any Budget"
                        if (priceRange.min === 100 && priceRange.max === 300) {
                          setPriceRange({ min: 0, max: 1000 });
                        } else {
                          setPriceRange({ min: 100, max: 300 });
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        priceRange.min === 100 && priceRange.max === 300
                          ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50 shadow-lg shadow-blue-500/25'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      $100 - $300
                    </button>
                    <button
                      onClick={() => {
                        // If already selected, deselect to "Any Budget"
                        if (priceRange.min === 300 && priceRange.max === 1000) {
                          setPriceRange({ min: 0, max: 1000 });
                        } else {
                          setPriceRange({ min: 300, max: 1000 });
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        priceRange.min === 300 && priceRange.max === 1000
                          ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50 shadow-lg shadow-blue-500/25'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      $300+
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Quick Tip - Below when expanded */}
        {isPriceFilterExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeInOut" }}
          >
            <div 
              {...useLongPress(triggerNumberSpam, {
                threshold: 500,
                cancelOnMovement: 15,
              })()}
              className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-400/20 cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-sm font-medium text-blue-200">Quick Tip</p>
                  <p className="text-xs text-blue-300/80">Long press any item to add it to your vision board</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

        <div className="space-y-8">
          {loading && <SkeletonSection />}

          {!loading && plan && plan.prompts.length === 0 && (
            <div className="px-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 text-gray-300">
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

      {/* Sticky Review Gear Button - Always visible */}
      <div className="fixed left-0 right-0 bottom-0 px-4 pb-6 pt-2 bg-gradient-to-t from-slate-900/90 via-slate-800/50 to-transparent backdrop-blur">
        <div className="flex gap-2">
          {onViewVisionBoard && (
            <button
              onClick={items.length > 0 ? onViewVisionBoard : undefined}
              data-review-gear-button
              className={`flex-1 h-12 rounded-xl font-medium shadow transition-colors ${
                items.length > 0 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 cursor-pointer' 
                  : 'bg-gray-600/50 text-gray-300 cursor-not-allowed'
              }`}
              disabled={items.length === 0}
            >
              {items.length > 0 ? 'Review Your Gear' : 'Add gear to begin'}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

/* ----------------------------- Prompt Row ----------------------------- */

const PromptRow: React.FC<{
  prompt: Prompt;
  blurb?: string;
  onAnyItemAdded: (product: any, element: HTMLElement | null) => void;
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
      // Extract price from product - handle different price formats with better fallbacks
      const priceStr = product.price?.amount || 
                      product.priceRange?.minVariantPrice?.amount || 
                      product.variants?.edges?.[0]?.node?.price?.amount ||
                      product.variants?.[0]?.price?.amount ||
                      (typeof product.price === 'string' ? product.price : '0');
      
      // Convert price string to number, handling currency symbols and commas
      const price = parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
      
      // If price is 0 or invalid, show the product anyway
      if (!price || isNaN(price)) return true;
      
      // Use a more lenient price range check
      return price >= (priceFilter.min || 0) && price <= (priceFilter.max || 1000);
    });
  }, [products, priceFilter]);

  // Calculate price range of available products for helpful messaging
  const productPriceRange = React.useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    
    const prices = products.map(product => {
      const priceStr = product.price?.amount || 
                      product.priceRange?.minVariantPrice?.amount || 
                      product.variants?.edges?.[0]?.node?.price?.amount ||
                      product.variants?.[0]?.price?.amount ||
                      (typeof product.price === 'string' ? product.price : '0');
      
      const price = parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
      return isNaN(price) ? null : price;
    }).filter((p): p is number => p !== null);

    if (prices.length === 0) return { min: 0, max: 0 };

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  // Determine what message to show when no products are visible
  const getFilterMessage = () => {
    if (products.length === 0) return null; // Don't show anything if no products at all
    if (filteredProducts.length > 0) return null; // Don't show message if products are visible
    
    // Products exist but are filtered out by price
    if (priceFilter.max < productPriceRange.min) {
      return `Try a higher budget (items start around $${Math.floor(productPriceRange.min)})`;
    } else if (priceFilter.min > productPriceRange.max) {
      return `Try a lower budget (items max around $${Math.ceil(productPriceRange.max)})`;
    } else {
      return "No items in this price range";
    }
  };

  const filterMessage = getFilterMessage();

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

  // Don't render the section at all if there are no products and it's not due to filtering
  if (!isLoading && !error && products.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold text-white">{prompt.label}</h2>

              {blurb === "__loading__" ? (
          <div className="h-3 w-52 bg-slate-600 rounded mt-2 animate-pulse" />
        ) : (
          <p className="text-sm text-gray-300 mt-1">{blurb || fallbackBlurb}</p>
        )}

        <p className="sr-only">
          Query: <span className="font-mono">{prompt.query}</span>
        </p>
      </div>

      {isLoading && <SkeletonCarousel />}

      {!isLoading && error && (
        <div className="px-4">
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
            Couldn't load products for this prompt. Try again.
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
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
                    className="embla__slide"
                  >
                    <LongPressToAdd
                      product={prod}
                      onAdded={(product, element) => {
                        removeById(key);
                        onAnyItemAdded(product, element);
                      }}
                    >
                      <ProductCard product={prod} />
                    </LongPressToAdd>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredProducts.length === 0 && filterMessage && (
              <div className="w-full px-4">
                <div className="text-sm text-blue-300 border border-blue-400/30 bg-blue-500/10 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-lg">💰</span>
                  <div>
                    <p className="font-medium">{filterMessage}</p>
                    <p className="text-xs text-blue-300/70 mt-1">
                      Available range: ${Math.floor(productPriceRange.min)} - ${Math.ceil(productPriceRange.max)}
                    </p>
                  </div>
                </div>
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
    <div className="w-full">
      <div className="px-4 mb-4">
        <div className="animate-pulse h-5 w-40 bg-slate-600 rounded" />
      </div>
      <SkeletonCarousel />
    </div>
  );
  
const SkeletonCarousel = () => (
  <div className="embla overflow-hidden">
    <div className="embla__container flex">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="embla__slide">
          <div className="h-44 rounded-xl bg-slate-700/60 border border-slate-600 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);