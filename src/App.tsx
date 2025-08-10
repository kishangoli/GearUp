import React, { useState } from "react";
import { OpenerPage } from "./pages/OpenerPage";
import { MainPage } from "./pages/MainPage";
import { FollowUpQuestionsPage } from "./pages/FollowUpQuestionsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { LoadingPage } from "./pages/LoadingPage";
import { useUserAnswers } from "./context/UserAnswersContext";
import { buildSearchPlanClient } from "./lib/fal";

type Page = "opener" | "main" | "followUp" | "loading" | "recommendations";

export const App: React.FC = () => {
  const [page, setPage] = useState<Page>("opener");
  const [plan, setPlan] = useState<{ prompts: { label: string; query: string }[] } | null>(null);
  const { answers } = useUserAnswers();

  const goMain = () => setPage("main");
  const goBackToOpener = () => setPage("opener");
  const handleProceedFromMain = () => setPage("followUp");
  const handleBackFromFollowUps = () => setPage("main");

  // NEW: show LoadingPage while FAL builds the plan
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

  if (page === "opener") return <OpenerPage onGetStarted={goMain} />;
  if (page === "main") return <MainPage onBack={goBackToOpener} onProceed={handleProceedFromMain} />;
  if (page === "followUp") {
    return (
      <FollowUpQuestionsPage
        selectedGoals={answers.goals}
        onBack={handleBackFromFollowUps}
        onComplete={handleFollowUpsComplete}
      />
    );
  }
  if (page === "loading") return <LoadingPage />;

  // recommendations
  return (
    <RecommendationsPage
      onBack={() => setPage("followUp")}
      plan={plan}
      loading={false}  // loader is now its own screen; no need to show per-page skeleton
    />
  );
};
