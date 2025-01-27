"use client";

import { useState, useCallback } from "react";
import { KnowledgeBaseFile } from "./useKnowledgeBaseFiles";
import axios from "axios";
import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";

interface FolderCache {
  [nodeId: string]: {
    contents: KnowledgeBaseFile[];
    path: string;
  };
}

export function useKnowledgeBaseFolders() {
  const [folderCache, setFolderCache] = useState<FolderCache>({});
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();

  const loadFolderContents = useCallback(
    async (nodeId: string, path: string) => {
      // Check the cache
      const cached = folderCache[nodeId];
      if (cached) {
        console.log("Cache hit for", nodeId);
        return cached.contents;
      }

      // If we're already loading this folder, wait for it
      if (loadingFolders.has(nodeId)) {
        return folderCache[nodeId]?.contents || [];
      }

      setLoadingFolders((prev) => new Set([...prev, nodeId]));

      try {
        const { data } = await axios.get<KnowledgeBaseFile[]>(
          `/api/knowledge-base/${knowledgeBaseId}/files?resourcePath=${path}`
        );

        // Cache the results
        setFolderCache((prev) => ({
          ...prev,
          [nodeId]: {
            contents: data,
            path,
          },
        }));

        return data;
      } catch (error) {
        console.error("Error loading knowledge base folder contents:", error);
        return [];
      } finally {
        setLoadingFolders((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      }
    },
    [folderCache, knowledgeBaseId, loadingFolders]
  );

  const clearCache = useCallback(() => {
    setFolderCache({});
  }, []);

  const clearFolderCache = useCallback((path: string) => {
    setFolderCache((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const isLoading = useCallback(
    (nodeId: string) => loadingFolders.has(nodeId),
    [loadingFolders]
  );

  const getFolderContents = useCallback(
    (nodeId: string) => folderCache[nodeId]?.contents,
    [folderCache]
  );

  return {
    loadFolderContents,
    clearCache,
    clearFolderCache,
    isLoading,
    getFolderContents,
  };
}
