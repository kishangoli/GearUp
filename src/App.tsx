import React, { useState } from "react";
import { OpenerPage } from "./pages/OpenerPage";
import { MainPage } from "./pages/MainPage";
import { FollowUpQuestionsPage } from "./pages/FollowUpQuestionsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { LoadingPage } from "./pages/LoadingPage";
import { TipsPage } from "./pages/TipsPage";
import { useUserAnswers } from "./context/UserAnswersContext";
import { buildSearchPlanClient } from "./lib/fal";

import { ProductCard } from "@shopify/shop-minis-react";
import { useVisionBoard } from "./context/VisionBoardContext";

type Page =
  | "opener"
  | "main"
  | "followUp"
  | "loading"
  | "recommendations"
  | "tips"
  | "visionBoard";

export const App: React.FC = () => {
  const [page, setPage] = useState<Page>("opener");
  const [plan, setPlan] = useState<{ prompts: { label: string; query: string }[] } | null>(null);
  const { answers } = useUserAnswers();

  const handleFollowUpsComplete = async () => {
    setPage("loading");
    try {
      const built = await buildSearchPlanClient(answers);
      setPlan(built);
    } catch (e) {
      console.error("Failed to build search plan:", e);
      setPlan({ prompts: [] });
    } finally {
      setPage("recommendations");
    }
  };

  if (page === "opener") return <OpenerPage onGetStarted={() => setPage("main")} />;

  if (page === "main")
    return <MainPage onBack={() => setPage("opener")} onProceed={() => setPage("followUp")} />;

  if (page === "followUp")
    return (
      <FollowUpQuestionsPage
        selectedGoals={answers.goals}
        onBack={() => setPage("main")}
        onComplete={handleFollowUpsComplete}
      />
    );

  if (page === "loading") return <LoadingPage />;

  if (page === "tips") return <TipsPage onBack={() => setPage("recommendations")} context={answers} />;

  if (page === "visionBoard") return <VisionBoardPage onBack={() => setPage("recommendations")} />;

  return (
    <RecommendationsPage
      onBack={() => setPage("followUp")}
      plan={plan}
      loading={false}
      footerCta={{ label: "Get tips for my cart", onClick: () => setPage("tips") }}
      onViewVisionBoard={() => setPage("visionBoard")}
    />
  );
};

/* ------------------------------- Vision Board ------------------------------ */

const VisionBoardPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { items, remove, clear } = useVisionBoard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-24">
      <div className="pt-12 px-4 pb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="text-lg mr-1">←</span>
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Vision board</h1>
        <div className="w-10" />
      </div>

      <div className="px-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg text-gray-700">
            Your vision board is empty. Swipe up on any product to add it.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {items.map((prod: any, i: number) => {
                const id = prod?.id ?? prod?.productId ?? prod?.handle ?? String(i);
                return (
                  <div key={id} className="relative">
                    <ProductCard product={prod} />
                    <button
                      onClick={() => remove(id)}
                      className="absolute top-2 right-2 text-xs px-2 py-1 rounded-lg bg-white/90 border border-gray-300 hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <button
                onClick={clear}
                className="w-full h-12 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium shadow-sm hover:bg-gray-50"
              >
                Clear board
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
