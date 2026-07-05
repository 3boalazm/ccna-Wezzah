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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
        style={S.hamburgerBtn}
        className="ccna-hamburger-btn ccna-press"
      >
        <span style={S.hamburgerLine} />
        <span style={S.hamburgerLine} />
        <span style={S.hamburgerLine} />
      </button>

      <div
        className="ccna-sidebar-backdrop"
        data-open={sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        topicIds={topicIds}
        activeTopicId={activeTopicId}
        onSelectTopic={(t) => {
          setActiveEngine(undefined);
          onSelectTopic(t);
        }}
        activeEngine={activeEngine}
        onSelectEngine={setActiveEngine}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main
        style={{
          ...S.main,
          borderTop: `3px solid ${activeEngine ? "var(--accent, #6C5CE7)" : accent}`,
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
  hamburgerBtn: {
    position: "fixed",
    top: 12,
    left: 12,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
  },
  hamburgerLine: {
    display: "block",
    width: 16,
    height: 2,
    borderRadius: 1,
    background: "var(--text-primary)",
  },
};
