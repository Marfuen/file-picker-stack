"use client";

import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";

export function useKnowledgeBase() {
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();
  return { knowledgeBaseId };
}
