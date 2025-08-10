import React from "react";
import { useProductSearch, ProductCard } from "@shopify/shop-minis-react";

type Prompt = { label: string; query: string };

interface RecommendationsPageProps {
  onBack: () => void;
  plan: { prompts: Prompt[] } | null;
  loading?: boolean;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  onBack,
  plan,
  loading,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="pt-12 px-4 pb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="text-lg mr-1">←</span>
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Your Recommendations</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 pb-10 space-y-6">
        {loading && <SkeletonSection />}

        {!loading && plan && plan.prompts.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg text-gray-700">
            No prompts yet. Try adjusting your answers.
          </div>
        )}

        {!loading &&
          plan?.prompts.map((p, idx) => <PromptRow prompt={p} key={`${p.label}-${idx}`} />)}
      </div>
    </div>
  );
};

/* ---------- Row: search + render ---------- */

const PromptRow: React.FC<{ prompt: Prompt }> = ({ prompt }) => {
  // Minis docs commonly use `first` for page size; some builds also accept `limit`.
  // We'll send `first` and adapt to the shape we get back.
  const raw: any = useProductSearch({ query: prompt.query, first: 6 });

  React.useEffect(() => {
    // Open Safari Web Inspector (Develop ▸ Simulator ▸ Shop) to see this.
    // eslint-disable-next-line no-console
    console.log("[useProductSearch]", { label: prompt.label, query: prompt.query, raw });
  }, [prompt.label, prompt.query, raw]);

  const isLoading =
    typeof raw?.isLoading === "boolean" ? raw.isLoading :
    typeof raw?.loading === "boolean" ? raw.loading :
    false;

  const error = raw?.error ?? null;

  // Support multiple possible result shapes without guessing SDK internals
  const results: any[] =
    Array.isArray(raw?.data) ? raw.data :
    Array.isArray(raw?.results) ? raw.results :
    Array.isArray(raw?.items) ? raw.items :
    Array.isArray(raw?.products) ? raw.products :
    Array.isArray(raw?.nodes) ? raw.nodes :
    Array.isArray(raw?.edges) ? raw.edges.map((e: any) => e?.node ?? e) :
    [];

  return (
    <section className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">{prompt.label}</h2>
      <p className="text-xs text-gray-500 mb-4">
        Query: <span className="font-mono">{prompt.query}</span>
      </p>

      {isLoading && <SkeletonGrid />}

      {!isLoading && error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          Couldn’t load products for this prompt. Try again.
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-2 gap-3">
          {results.map((prod: any, i: number) => (
            <ProductCard key={prod?.id ?? prod?.productId ?? prod?.handle ?? i} product={prod} />
          ))}

          {results.length === 0 && (
            <div className="col-span-2 text-sm text-gray-500 border border-gray-200 rounded-xl p-4">
              No results matched this query.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

/* ---------- Skeletons ---------- */

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
