// ui/layout/WorkspaceLayout.tsx
// The app shell: Sidebar (desktop) / MobileNav (< 860px floating pill) +
// main content pane, scrollable. Visual language ported from the HLOS
// learner shell per Ahmed's request (see Sidebar.tsx / MobileNav.tsx
// headers for details) — CSS alone decides which nav renders at a given
// width (.ccna-desktop-sidebar / .ccna-mobile-pill-nav in tokens.css), so
// there's no layout-thrash on resize and no duplicated nav state.

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { domainOf } from "./domains";
import QuestionBankPage from "../pages/QuestionBankPage";
import ExamPage from "../pages/ExamPage";
import ScenarioPage from "../pages/ScenarioPage";
import ReviewPage from "../pages/ReviewPage";

const DOMAIN_ACCENT: Record<string, string> = {
  routing: "var(--domain-routing)",
  switching: "var(--domain-switching)",
  security: "var(--domain-security)",
  "ip-services": "var(--domain-ip-services)",
  automation: "var(--domain-automation)",
  wireless: "var(--domain-wireless)",
  architecture: "var(--domain-architecture)",
};

export interface WorkspaceLayoutProps {
  topicIds: string[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  children: React.ReactNode; // the TopicPage content, shown when no engine is active
}

export default function WorkspaceLayout({
  topicIds,
  activeTopicId,
  onSelectTopic,
  children,
}: WorkspaceLayoutProps) {
  const [activeEngine, setActiveEngine] = useState<string | undefined>(undefined);
  const accent = DOMAIN_ACCENT[domainOf(activeTopicId)];

  const selectTopic = (t: string) => {
    setActiveEngine(undefined);
    onSelectTopic(t);
  };

  let mainContent: React.ReactNode;
  if (activeEngine === "question-bank") {
    mainContent = <QuestionBankPage topicId={activeTopicId} />;
  } else if (activeEngine === "exam") {
    mainContent = <ExamPage />;
  } else if (activeEngine === "troubleshooting") {
    mainContent = <ScenarioPage />;
  } else if (activeEngine === "review") {
    mainContent = <ReviewPage />;
  } else {
    mainContent = children; // no engine selected -> showing a topic
  }

  return (
    <div style={S.shell}>
      <Sidebar
        topicIds={topicIds}
        activeTopicId={activeTopicId}
        onSelectTopic={selectTopic}
        activeEngine={activeEngine}
        onSelectEngine={setActiveEngine}
      />
      <MobileNav
        topicIds={topicIds}
        activeTopicId={activeTopicId}
        onSelectTopic={selectTopic}
        activeEngine={activeEngine}
        onSelectEngine={setActiveEngine}
      />
      <main
        style={{
          ...S.main,
          borderTop: `3px solid ${activeEngine ? "var(--accent)" : accent}`,
          transition: "border-color 0.2s ease",
        }}
        className="ccna-main-mobile"
      >
        <div key={activeEngine ?? activeTopicId} style={S.content} className="ccna-anim-fade-up">
          {mainContent}
        </div>
      </main>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", background: "var(--ws-bg)" },
  main: { flex: 1, overflowY: "auto", minWidth: 0 },
  content: { maxWidth: 860, margin: "0 auto", padding: "0 20px 80px" },
};
