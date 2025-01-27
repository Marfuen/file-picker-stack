"use client";

import { useCallback } from "react";
import { useKnowledgeBaseActions } from "./useKnowledgeBaseActions";
import type { CreateKnowledgeBaseParams } from "./useKnowledgeBaseActions";

export function useKnowledgeBaseMutations() {
  const { createKnowledgeBase, deleteKnowledgeBase, isLoading, error } =
    useKnowledgeBaseActions();

  return {
    // Loading and error states
    isLoading,
    error,

    // Memoized actions
    createKnowledgeBase: useCallback(
      (params: CreateKnowledgeBaseParams) => createKnowledgeBase(params),
      [createKnowledgeBase]
    ),
    deleteKnowledgeBase: useCallback(
      () => deleteKnowledgeBase(),
      [deleteKnowledgeBase]
    ),
  };
}
