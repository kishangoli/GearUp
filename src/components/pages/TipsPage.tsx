// src/pages/TipsPage.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSavedProducts } from "@shopify/shop-minis-react";
import { buildCartTipsClient, type CartItemInput, type CartTips } from "../fal-usage/fal";

type TipsPageProps = {
  onBack: () => void;
  context?: any;         // optional: your onboarding answers
  onBrowseMore?: () => void; // optional: route back to browse
};

export const TipsPage: React.FC<TipsPageProps> = ({ onBack, context, onBrowseMore }) => {
  // 1) Read saved products from Minis SDK
  const raw: any = useSavedProducts();

  const isLoading =
    typeof raw?.isLoading === "boolean" ? raw.isLoading :
    typeof raw?.loading === "boolean" ? raw.loading : false;

  const error = raw?.error ?? null;

  // Support a few possible shapes ('products', 'data', 'results', 'items')
  const saved: any[] =
    Array.isArray(raw?.products) ? raw.products :
    Array.isArray(raw?.data) ? raw.data :
    Array.isArray(raw?.results) ? raw.results :
    Array.isArray(raw?.items) ? raw.items : [];

  // 2) Map → our FAL input
  const items: CartItemInput[] = saved.map((p: any) => ({
    id: p.id ?? p.productId ?? p.handle ?? String(Math.random()),
    title: p.title ?? p.product?.title ?? "Untitled",
    quantity: 1,
    variantTitle: p.variantTitle ?? p.selectedVariant?.title,
    productType: p.productType ?? p.product?.productType,
    tags: p.tags ?? p.product?.tags ?? [],
  }));

  // Stable key so effect re-runs only when the item set actually changes
  const itemsKey = React.useMemo(
    () => JSON.stringify(items.map(i => [i.id, i.title, i.quantity])),
    [saved] // tie to SDK result so it updates when saved products load/change
  );

  const [tips, setTips] = React.useState<CartTips | null>(null);
  const [genLoading, setGenLoading] = React.useState(true);
  const [genError, setGenError] = React.useState<string | null>(null);

  // 3) Generate tips WHEN saved products are ready (this was the bug)
  React.useEffect(() => {
    if (isLoading || error) return;        // wait for SDK to finish
    let cancelled = false;

    if (items.length === 0) {
      setGenLoading(false);
      setTips(null);
      return;
    }

    (async () => {
      try {
        setGenLoading(true);
        setGenError(null); // Clear previous errors
        const t = await buildCartTipsClient(items, context);
        if (!cancelled) setTips(t);
      } catch (e: any) {
        if (!cancelled) {
          setGenError(e.message || "Couldn’t generate tips right now.");
          setTips(null); // Ensure no stale tips are shown
        }
      } finally {
        if (!cancelled) setGenLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // Re-run when saved products finish loading or item set changes
  }, [isLoading, error, itemsKey, context]); // <-- key change

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      {/* Sticky Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-12 h-12 text-gray-800 hover:text-gray-600 transition-all duration-200"
        >
          <span className="text-xl">←</span>
        </button>
      </div>

      <div className="pt-12 px-4 pb-6 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Tips for your picks</h1>
      </div>

      {/* Saved products state (SDK) */}
      {isLoading && <SavedLoader />}

      {!isLoading && error && (
        <div className="px-4 pb-12">
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
            Couldn’t load your saved products.
          </div>
        </div>
      )}

      {!isLoading && !error && saved.length === 0 && (
        <div className="px-4 pb-12 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">No saved products yet</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tap the save icon on a few products you like, then come back for personalized tips.
            </p>
            {onBrowseMore && (
              <button
                onClick={onBrowseMore}
                className="mt-4 h-11 w-full rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
              >
                Browse products
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tips generation / render */}
      {!isLoading && !error && saved.length > 0 && (
        <div className="px-4 pb-12">
          {genLoading ? (
            <TipsLoader />
          ) : genError ? (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
              {genError}
            </div>
          ) : tips && tips.tips.length > 0 ? (
            <div className="space-y-4">
              {tips.tips.map((t, i) => (
                <motion.section
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                        {t.tipType}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
                    </div>
                    {t.timeEstimate && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                        {t.timeEstimate}
                      </span>
                    )}
                  </div>

                  {t.items?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Uses: {t.items.join(", ")}</p>
                  )}

                  {t.steps && t.steps.length > 0 && (
                    <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-gray-800">
                      {t.steps.map((s, idx) => <li key={idx}>{s}</li>)}
                    </ol>
                  )}

                  {t.notes && <p className="mt-3 text-sm text-gray-600">{t.notes}</p>}
                </motion.section>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 border border-gray-200 rounded-xl p-4">
              No tips yet. Try saving 2–3 products and refresh.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Loaders ---------- */

const SavedLoader = () => (
  <div className="px-6 pb-12">
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Loading your saved products…</h2>
        <div className="space-y-3 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className="h-16 rounded-xl bg-white/60 border border-gray-200 overflow-hidden"
            >
              <motion.div
                className="w-full h-full"
                animate={{ backgroundPositionX: ["0%", "100%"] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0) 100%)",
                  backgroundSize: "200% 100%",
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
);

const TipsLoader = () => (
  <div className="px-6 pb-12">
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Generating your tips…</h2>
        <p className="text-sm text-gray-600 mb-4">Personalizing ideas for your saved products</p>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className="h-16 rounded-xl bg-white/60 border border-gray-200 overflow-hidden"
            >
              <motion.div
                className="w-full h-full"
                animate={{ backgroundPositionX: ["0%", "100%"] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0) 100%)",
                  backgroundSize: "200% 100%",
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
);
