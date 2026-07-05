// ui/layout/WorkspaceLayout.tsx
// The app shell: Sidebar (left, fixed) + main content pane (right, scrollable).
// This replaces main.tsx rendering <TopicPage /> directly — TopicPage now
// renders INSIDE this shell as the main-pane content when a topic is active.

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { domainOf } from "./domains";

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
  children: React.ReactNode; // the active page content (TopicPage, QuestionBankPage, etc.)
}

export default function WorkspaceLayout({
  topicIds,
  activeTopicId,
  onSelectTopic,
  children,
}: WorkspaceLayoutProps) {
  const [activeEngine, setActiveEngine] = useState<string | undefined>(undefined);
  const accent = DOMAIN_ACCENT[domainOf(activeTopicId)];

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
      <main style={{ ...S.main, borderTop: `3px solid ${accent}` }}>
        <div style={S.content}>{children}</div>
      </main>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", background: "var(--ws-bg)" },
  main: { flex: 1, overflowY: "auto" },
  content: { maxWidth: 860, margin: "0 auto", padding: "0 20px 80px" },
};
