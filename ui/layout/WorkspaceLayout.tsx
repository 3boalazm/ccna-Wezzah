// ui/layout/WorkspaceLayout.tsx
// The app shell: Sidebar (desktop) / MobileNav (< 860px floating pill) +
// main content pane. Owns the top-level "what's showing" state — a
// Dashboard home view (default), a single Topic view, or one of the four
// engine pages — so Sidebar/MobileNav/DashboardPage can all trigger
// navigation without prop-drilling through main.tsx. Exam and Question
// Bank can additionally request "focus mode" (hides chrome entirely,
// ported from HLOS's distraction-free assess/session screen) via the
// onEnterFocusMode/onExitFocusMode callbacks passed to their pages.

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { domainOf } from "./domains";
import DashboardPage from "../pages/DashboardPage";
import QuestionBankPage from "../pages/QuestionBankPage";
import ExamPage from "../pages/ExamPage";
import ScenarioPage from "../pages/ScenarioPage";
import ReviewPage from "../pages/ReviewPage";
import { useLanguage } from "../i18n/LanguageContext";

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
  children: React.ReactNode; // the TopicPage content, shown when view === "topic"
}

type View = "home" | "topic";

export default function WorkspaceLayout({
  topicIds,
  activeTopicId,
  onSelectTopic,
  children,
}: WorkspaceLayoutProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<View>("home");
  const [activeEngine, setActiveEngine] = useState<string | undefined>(undefined);
  const [focusMode, setFocusMode] = useState(false);
  const accent = DOMAIN_ACCENT[domainOf(activeTopicId)];

  const selectTopic = (t: string) => {
    setActiveEngine(undefined);
    setFocusMode(false);
    setView("topic");
    onSelectTopic(t);
  };

  const selectEngine = (id: string) => {
    setActiveEngine(id);
    setFocusMode(false);
  };

  const goHome = () => {
    setActiveEngine(undefined);
    setFocusMode(false);
    setView("home");
  };

  let mainContent: React.ReactNode;
  if (activeEngine === "question-bank") {
    mainContent = <QuestionBankPage topicId={activeTopicId} onFocusChange={setFocusMode} />;
  } else if (activeEngine === "exam") {
    mainContent = <ExamPage onFocusChange={setFocusMode} />;
  } else if (activeEngine === "troubleshooting") {
    mainContent = <ScenarioPage onFocusChange={setFocusMode} />;
  } else if (activeEngine === "review") {
    mainContent = <ReviewPage />;
  } else if (view === "home") {
    mainContent = (
      <DashboardPage topicIds={topicIds} onSelectTopic={selectTopic} onSelectEngine={selectEngine} />
    );
  } else {
    mainContent = children;
  }

  if (focusMode) {
    // Distraction-free: no sidebar/mobile nav at all, full-bleed content
    // with just a minimal exit affordance — matches HLOS's exam-session
    // pattern of hiding the shell entirely during a timed run.
    return (
      <div style={S.focusShell}>
        <button type="button" onClick={goHome} className="ccna-hoverable ccna-press" style={S.focusExit}>
          {t("common.exit")}
        </button>
        <div style={S.focusContent} className="ccna-anim-fade-up">
          {mainContent}
        </div>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <Sidebar
        topicIds={topicIds}
        activeTopicId={activeTopicId}
        onSelectTopic={selectTopic}
        activeEngine={activeEngine}
        onSelectEngine={selectEngine}
        isHomeActive={view === "home" && !activeEngine}
        onGoHome={goHome}
      />
      <MobileNav
        topicIds={topicIds}
        activeTopicId={activeTopicId}
        onSelectTopic={selectTopic}
        activeEngine={activeEngine}
        onSelectEngine={selectEngine}
        isHomeActive={view === "home" && !activeEngine}
        onGoHome={goHome}
      />
      <main
        style={{
          ...S.main,
          borderTop: `3px solid ${activeEngine ? "var(--accent)" : view === "home" ? "var(--accent)" : accent}`,
          transition: "border-color 0.2s ease",
        }}
        className="ccna-main-mobile"
      >
        <div key={activeEngine ?? view + activeTopicId} style={S.content} className="ccna-anim-fade-up">
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
  focusShell: { minHeight: "100vh", background: "var(--ws-bg)" },
  focusExit: {
    position: "fixed",
    top: 14,
    insetInlineStart: 14,
    zIndex: 20,
    padding: "7px 14px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    color: "var(--text-secondary)",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  focusContent: { maxWidth: 760, margin: "0 auto", padding: "60px 20px 60px" },
};
