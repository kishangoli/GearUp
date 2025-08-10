import React from "react";
import { useProductSearch, ProductCard } from "@shopify/shop-minis-react";

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

    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
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
          className="flex items-center text-white/80 hover:text-white transition-colors"
        >
          <span className="text-lg mr-1">←</span>
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Your Recommendations</h1>
        <div className="w-10" />
      </div>

        <div className="px-4 pb-10 space-y-6">
          {loading && <SkeletonSection />}

          {!loading && plan && plan.prompts.length === 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-white/80">
              No prompts yet. Try adjusting your answers.
            </div>
          )}


        {!loading &&
          plan?.prompts.map((p, idx) => (
            <PromptRow
              key={`${p.label}-${idx}`}
              prompt={p}
              blurb={blurbsLoading ? "__loading__" : (blurbs[p.label] ?? "")}
              onAnyItemAdded={notifyAdded} // <-- tell parent to show toast
            />
          ))}
      </div>

      {(items.length > 0 || footerCta) && (
        <div className="fixed left-0 right-0 bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-indigo-100/80 via-indigo-100/30 to-transparent backdrop-blur">
          <div className="flex gap-2">
            {onViewVisionBoard && items.length > 0 && (
              <button
                onClick={onViewVisionBoard}
                className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
              >
                View vision board ({items.length})
              </button>
            )}
            {footerCta && (
              <button
                onClick={footerCta.onClick}
                className="h-12 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium shadow-sm hover:bg-gray-50"
              >
                {footerCta.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ----------------------------- Prompt Row ----------------------------- */

const PromptRow: React.FC<{
  prompt: Prompt;
  blurb?: string;
  onAnyItemAdded: () => void; // NEW
}> = ({ prompt, blurb, onAnyItemAdded }) => {
  const raw: any = useProductSearch({ query: prompt.query, first: 6 });

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

  const removeById = (id: string) => {
    setProducts((prev) => prev.filter((p, i) => idOf(p, i) !== id));
  };

  const fallbackBlurb = `Curated picks to help you shop ${prompt.label.toLowerCase()}.`;

  return (
    <section className="bg-white rounded-2xl p-6 shadow-lg">

      <h2 className="text-lg font-semibold text-gray-800">{prompt.label}</h2>

      {blurb === "__loading__" ? (
        <div className="h-3 w-52 bg-gray-200 rounded mt-2 mb-3 animate-pulse" />
      ) : (
        <p className="text-xs text-gray-600 mt-1 mb-3">{blurb || fallbackBlurb}</p>
      )}

      <p className="sr-only">
        Query: <span className="font-mono">{prompt.query}</span>
      </p>

      {isLoading && <SkeletonGrid />}

      {!isLoading && error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          Couldn’t load products for this prompt. Try again.
        </div>
      )}

      {!isLoading && !error && (

        <motion.div
          layout
          className="grid grid-cols-2 gap-3"
          transition={{ layout: { type: "spring", stiffness: 500, damping: 40, mass: 0.8 } }}
        >
          <AnimatePresence>
            {products.map((prod, i) => {
              const key = idOf(prod, i);
              return (
                <motion.div
                  key={key}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.8 }}
                >
                  <LongPressToAdd
                    product={prod}
                    onAdded={() => {
                      removeById(key);
                      onAnyItemAdded(); // <-- trigger global toast
                    }}
                  >
                    <ProductCard product={prod} />
                  </LongPressToAdd>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {products.length === 0 && (
            <div className="col-span-2 text-sm text-gray-500 border border-gray-200 rounded-xl p-4">
              No results matched this query.
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
};

/* ----------------------------- Skeletons ----------------------------- */

const SkeletonSection = () => (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="animate-pulse h-5 w-40 bg-gray-200 rounded mb-4" />
      <SkeletonGrid />
    </div>
  );
  
const SkeletonGrid = () => (
<div className="grid grid-cols-2 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="h-44 rounded-xl bg-white/60 border border-gray-200 animate-pulse" />
    ))}
</div>
);