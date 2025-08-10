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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
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
            <h1 className="text-2xl font-bold text-gray-900">
              Finding great picks for you…
            </h1>
            <p className="text-gray-600 mt-1">
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
                  className="mx-auto w-full max-w-sm h-24 rounded-2xl bg-white shadow-lg border border-gray-200 overflow-hidden mb-4"
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
                    <div className="w-24 h-full bg-gray-100" />
                    {/* text skeletons */}
                    <div className="flex-1 p-4">
                      <div className="h-4 w-3/5 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-4/5 bg-gray-200 rounded mb-1.5" />
                      <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </motion.div>

                  {/* shimmer overlay */}
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
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "65%", "92%", "100%"] }}
            transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
            className="h-2 bg-blue-500 rounded-full shadow-inner"
          />
          <div className="text-xs text-gray-500 mt-2 text-center">
            This usually takes a few seconds
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
