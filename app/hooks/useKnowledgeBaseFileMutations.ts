"use client";

import { useCallback } from "react";
import { useKnowledgeBaseFileActions } from "./useKnowledgeBaseFileActions";

export function useKnowledgeBaseFileMutations() {
  const { deleteFile, triggerSync, isLoading, error } =
    useKnowledgeBaseFileActions();

  return {
    // Loading and error states
    isLoading,
    error,

    // Memoized actions
    deleteFile: useCallback(
      async (path: string) => {
        return await deleteFile(path);
      },
      [deleteFile]
    ),
    triggerSync: useCallback(() => triggerSync(), [triggerSync]),
  };
}
