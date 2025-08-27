import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import { MinisContainer } from "@shopify/shop-minis-react";

import { App } from "./App";
import { UserAnswersProvider } from "./components/context/UserAnswersContext";
import { VisionBoardProvider } from "./components/context/VisionBoardContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MinisContainer>
      <VisionBoardProvider>
        <UserAnswersProvider>
          <App />
        </UserAnswersProvider>
      </VisionBoardProvider>
    </MinisContainer>
  </StrictMode>
);
