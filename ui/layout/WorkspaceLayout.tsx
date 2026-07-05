// ui/layout/WorkspaceLayout.tsx
// The app shell: Sidebar (left, fixed) + main content pane (right, scrollable).
//
// BUGFIX: previously tracked `activeEngine` state but never used it to decide
// what renders in <main> — clicking an Engine link in the Sidebar silently did
// nothing. This version actually switches the rendered page based on it.
// Only Question Bank is wired to a real, working engine (question-engine is
// fully implemented); Exam/Troubleshooting/Review render an honest
// "not implemented yet" state instead of a dead click.

import React, { useState } from "react";
import Sidebar from "./Sidebar";
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
        onSelectTopic={(t) => {
          setActiveEngine(undefined);
          onSelectTopic(t);
        }}
        activeEngine={activeEngine}
        onSelectEngine={setActiveEngine}
      />
      <main
        style={{
          ...S.main,
          borderTop: `3px solid ${activeEngine ? "var(--accent, #6C5CE7)" : accent}`,
          transition: "border-color 0.2s ease",
        }}
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
  main: { flex: 1, overflowY: "auto" },
  content: { maxWidth: 860, margin: "0 auto", padding: "0 20px 80px" },
};
