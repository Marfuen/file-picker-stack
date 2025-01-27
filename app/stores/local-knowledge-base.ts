import { create } from "zustand";

const KNOWLEDGE_BASE_ID_KEY = "knowledgeBaseId";

interface LocalKnowledgeBaseStore {
  // Local state
  knowledgeBaseId: string | null;

  // Local actions
  setKnowledgeBaseId: (id: string | null) => void;
  clearKnowledgeBase: () => void;
}

export const useLocalKnowledgeBaseStore = create<LocalKnowledgeBaseStore>(
  (set) => ({
    knowledgeBaseId:
      typeof window !== "undefined"
        ? localStorage.getItem(KNOWLEDGE_BASE_ID_KEY)
        : null,

    setKnowledgeBaseId: (id: string | null) => {
      if (id) {
        localStorage.setItem(KNOWLEDGE_BASE_ID_KEY, id);
      } else {
        localStorage.removeItem(KNOWLEDGE_BASE_ID_KEY);
      }
      set({ knowledgeBaseId: id });
    },

    clearKnowledgeBase: () => {
      localStorage.removeItem(KNOWLEDGE_BASE_ID_KEY);
      set({ knowledgeBaseId: null });
    },
  })
);
