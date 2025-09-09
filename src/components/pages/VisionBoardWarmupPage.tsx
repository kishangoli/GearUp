import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisionBoard } from "../context/VisionBoardContext";
import { prefetchTipsForItems } from "../utils/tipsPrefetch";

type Props = {
  onDone: () => void; // navigate to VisionBoardPage
  onBack?: () => void;
  title?: string;     // optional override
};

export default function VisionBoardWarmupPage({ onDone, onBack, title = "Getting your gear ready…" }: Props) {
  const { items } = useVisionBoard();

  const [progress, setProgress] = React.useState({ done: 0, total: items.length });
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 100;

  React.useEffect(() => {
    let cancelled = false;

    // lock scroll
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    (async () => {
      await prefetchTipsForItems(items, {
        concurrency: 3,
        onProgress: (done, total) => {
          if (!cancelled) setProgress({ done, total });
        },
      });
      if (!cancelled) onDone();
    })();

    return () => {
      cancelled = true;
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [items, onDone]);

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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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

        .loading-dots {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="relative min-h-screen animated-bg flex items-center justify-center">
        
        {/* Sticky Back Button */}
        {onBack && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-12 h-12 text-white hover:text-gray-300 transition-all duration-200"
            >
              <span className="text-xl">←</span>
            </button>
          </div>
        )}

        <div className="w-[320px] max-w-[90vw] rounded-3xl glass-morphism floating-element p-6 text-center">
          <div className="mb-4 text-4xl">⚡</div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-xs text-gray-300 mt-1">Pre-generating tips for your saved items<span className="loading-dots">...</span></p>

        <div className="mt-5">
          <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
            <motion.div
              key={pct}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35 }}
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 glow-effect"
              style={{ borderRadius: 999 }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">{progress.done} / {progress.total} ready</div>
        </div>

        <AnimatePresence>
          {pct >= 100 && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <button
                onClick={onDone}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 transition-all duration-200 glow-effect"
              >
                Open my board
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
