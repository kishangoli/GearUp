import React, { useState } from "react";
import { OpenerPage } from "./pages/OpenerPage";
import { MainPage } from "./pages/MainPage";
import { FollowUpQuestionsPage } from "./pages/FollowUpQuestionsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { LoadingPage } from "./pages/LoadingPage";
import { TipsPage } from "./pages/TipsPage";
import VisionBoardPage from "./pages/VisionBoardPage";
import { useUserAnswers } from "./context/UserAnswersContext";
import { buildSearchPlanClient } from "./lib/fal";

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

  if (page === "tips")
    return <TipsPage onBack={() => setPage("recommendations")} context={answers} />;

  if (page === "visionBoard")
    return <VisionBoardPage onBack={() => setPage("recommendations")} />;

  // recommendations
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
