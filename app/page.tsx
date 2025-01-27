"use client";

import { KnowledgeBaseWizard } from "./components/KnowledgeBaseWizard";
import { KnowledgeBaseView } from "./components/KnowledgeBaseWizard/KnowledgeBaseView";
import { useLocalKnowledgeBaseStore } from "./stores/local-knowledge-base";

export default function Home() {
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();

  if (knowledgeBaseId) {
    return <KnowledgeBaseView />;
  }

  return <KnowledgeBaseWizard />;
}
