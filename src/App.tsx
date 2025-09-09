import React, { useState } from "react";
import { OpenerPage } from "./components/pages/OpenerPage";
import { MainPage } from "./components/pages/MainPage";
import { FollowUpQuestionsPage } from "./components/pages/FollowUpQuestionsPage";
import { RecommendationsPage } from "./components/pages/RecommendationsPage";
import { LoadingPage } from "./components/pages/LoadingPage";
import { TipsPage } from "./components/pages/TipsPage";
import VisionBoardPage from "./components/pages/VisionBoardPage";
import VisionBoardWarmupPage from "./components/pages/VisionBoardWarmupPage";
import { useUserAnswers } from "./components/context/UserAnswersContext";
import { buildSearchPlanClient } from "./components/fal-usage/fal";


/* ---------------- Error Boundary (shows errors instead of white screen) --------------- */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  state = { error: null as any };
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any, info: any) { console.error("App error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error?.message || this.state.error)}</pre>
          <p style={{ color: "#666" }}>Check the console for full stack trace.</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}
/* ------------------------------------------------------------------------------------- */

type Page =
  | "opener"
  | "main"
  | "followUp"
  | "loading"
  | "recommendations"
  | "tips"
  | "visionBoardWarmup"
  | "visionBoard";

export const App: React.FC = () => {
  const [page, setPage] = useState<Page>("opener");
  const [plan, setPlan] = useState<{ prompts: { label: string; query: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ guard answers so we never crash on cold boot
  const ua = useUserAnswers();
  const answers = ua?.answers ?? { goals: [] as string[] };

  const handleFollowUpsComplete = async () => {
    console.log("Starting to load recommendations...");
    setPage("loading");
    
    // Force a minimum loading time to ensure users see the LoadingPage
    const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds minimum
    
    try {
      console.log("Building search plan...");
      const [built] = await Promise.all([
        buildSearchPlanClient(answers),
        minimumLoadingTime
      ]);
      console.log("Search plan built successfully:", built);
      setPlan(built);
      setError(null); // Clear any previous errors
    } catch (e: any) {
      // Still wait for minimum time even on error
      await minimumLoadingTime;
      console.error("Failed to build search plan:", e);
      setError(e.message || "An unexpected error occurred. Please try again.");
      setPlan({ prompts: [] }); // Ensure plan is not null
    } finally {
      console.log("Transitioning to recommendations page...");
      setPage("recommendations");
    }
  };

  let content: React.ReactNode;

  // Debug logging
  console.log("Current page:", page);

  switch (page) {
    case "opener":
      content = <OpenerPage onGetStarted={() => setPage("main")} />;
      break;

    case "main":
      content = <MainPage onBack={() => setPage("opener")} onProceed={() => setPage("followUp")} />;
      break;

    case "followUp":
      content = (
        <FollowUpQuestionsPage
          selectedGoals={Array.isArray(answers?.goals) ? answers.goals : []}
          onBack={() => setPage("main")}
          onComplete={handleFollowUpsComplete}
        />
      );
      break;

    case "loading":
      console.log("Rendering LoadingPage");
      content = <LoadingPage />;
      break;

    case "tips":
      content = <TipsPage onBack={() => setPage("recommendations")} context={answers} />;
      break;

    case "visionBoardWarmup":
      content = (
        <VisionBoardWarmupPage
          onDone={() => setPage("visionBoard")}
          onBack={() => setPage("recommendations")}
          title="Getting your board ready…"
        />
      );
      break;

    case "visionBoard":
      content = <VisionBoardPage onBack={() => setPage("recommendations")} />;
      break;

    default:
      // recommendations (default/fallback)
      content = (
        <RecommendationsPage
          onBack={() => setPage("followUp")}
          plan={plan}
          loading={false}
          footerCta={{ label: "Get tips for my cart", onClick: () => setPage("tips") }}
          onViewVisionBoard={() => setPage("visionBoardWarmup")}
        />
      );
  }

  return (
    <ErrorBoundary>
      {content}
      {error && (
        <div 
          style={{ 
            position: 'fixed', 
            bottom: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            backgroundColor: 'red', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            zIndex: 1000 
          }}
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
    </ErrorBoundary>
  );
};
