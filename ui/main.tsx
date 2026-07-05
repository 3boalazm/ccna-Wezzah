// ui/main.tsx — application entry point.
// Loads the knowledge base ONCE before the first render, so useKnowledge (which
// reads synchronously from the in-memory cache) always resolves. This is the
// single place init() is called — every engine/hook downstream assumes it ran.

import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import * as knowledgeEngine from "../engines/knowledge-engine";
import TopicPage from "./pages/TopicPage";
import WorkspaceLayout from "./layout/WorkspaceLayout";
import "./styles/tokens.css";

// The topics converted so far (nat was the reference; ospf + acl added in
// step 3). Extend this list as more /knowledge/*.json files are added —
// this is presentation-layer wiring only, not a Knowledge Engine concern.
const TOPICS = ["nat", "ospf", "acl"];

function App() {
  const [activeTopicId, setActiveTopicId] = useState("nat");

  return (
    <WorkspaceLayout
      topicIds={TOPICS}
      activeTopicId={activeTopicId}
      onSelectTopic={setActiveTopicId}
    >
      <TopicPage initialTopic={activeTopicId} />
    </WorkspaceLayout>
  );
}

async function bootstrap() {
  const el = document.getElementById("root");
  if (!el) throw new Error("#root element not found in index.html");

  try {
    await knowledgeEngine.init();
  } catch (e) {
    el.innerHTML = `<pre style="color:#8a1c1c;padding:20px;font-family:system-ui">
Failed to load the knowledge base:
${(e as Error).message}
</pre>`;
    return;
  }

  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
