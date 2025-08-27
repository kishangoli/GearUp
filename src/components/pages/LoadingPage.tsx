import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A sleek, product-themed loading scene:
 * - Title fades in
 * - Three "skeleton product cards" slide + float in a stagger
 * - A looping progress bar runs underneath
 */
export const LoadingPage: React.FC = () => {
  return (
    <>
      <style>{`
        html {
          background-color: #284B63 !important;
          min-height: 100%;
          overscroll-behavior: none;
        }
        
        body {
          overflow-x: hidden;
          max-width: 100vw;
          background-color: #284B63 !important;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
        
        #root {
          background-color: #284B63;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: none;
        }
        
        /* Ensure consistent background throughout */
        * {
          box-sizing: border-box;
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
        
        @keyframes slideInUp {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animated-bg {
          background: linear-gradient(-45deg, #242331, #284B63, #242331, #284B63);
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
        
        .glass-morphism::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.8s ease;
        }
        
        .glass-morphism.animate-shimmer::before {
          left: 100%;
        }
        
        .glass-morphism:active {
          transform: scale(0.98);
        }
        
        .glass-morphism-selected {
          background: rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 
            0 8px 32px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .glass-morphism-selected::before {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.15),
            transparent
          );
        }
        
        .slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
        
        .fade-in-stagger {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .stagger-animation {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        
        /* Enhanced mobile touch feedback */
        .touch-feedback:active {
          transform: scale(0.95);
          filter: brightness(1.1);
        }
        
        /* Enhanced Glassmorphism Loading Cards */
        .loading-card {
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
        
        .loading-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        
        /* Glassmorphism skeleton elements */
        .glass-skeleton {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          border-radius: 0.5rem;
        }
        
        .glass-skeleton-image {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
        }
      `}</style>
      <div className="min-h-screen animated-bg flex items-center justify-center px-6">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl font-bold text-white slide-in-up">
                Finding great picks for you…
              </h1>
              <p className="text-gray-300 mt-1 slide-in-up" style={{ animationDelay: '0.2s' }}>
                Crafting your shopping plan and fetching products
              </p>
            </motion.div>

          {/* Stacked “product skeletons” */}
          <div className="relative h-72">
            <motion.div
              className="absolute inset-0"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.14 } },
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`mx-auto w-full max-w-sm h-24 rounded-2xl loading-card overflow-hidden mb-4 fade-in-stagger stagger-${i + 1}`}
                  variants={{
                    hidden: { y: 24, opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  style={{
                    transformOrigin: "center",
                  }}
                >
                  {/* subtle float loop */}
                  <motion.div
                    className="w-full h-full flex"
                    animate={{
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 1.6 + i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* image block */}
                    <div className="w-24 h-full glass-skeleton-image" />
                    {/* text skeletons */}
                    <div className="flex-1 p-4">
                      <div className="h-4 w-3/5 glass-skeleton mb-2" />
                      <div className="h-3 w-4/5 glass-skeleton mb-1.5" />
                      <div className="h-3 w-1/3 glass-skeleton" />
                    </div>
                  </motion.div>

                  {/* enhanced glassmorphism shimmer overlay */}
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
    </>
  );
};
