"use client";

import { useState, useCallback } from "react";
import { useKnowledgeBase } from "./useKnowledgeBase";
import { GoogleDriveFile } from "@/app/types/google-drive";
import axios from "axios";

interface FolderCache {
  [nodeId: string]: {
    contents: GoogleDriveFile[];
    path: string;
  };
}

export function useKnowledgeBaseFiles() {
  const [folderCache, setFolderCache] = useState<FolderCache>({});
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const { getStoredKnowledgeBaseId } = useKnowledgeBase();
  const knowledgeBaseId = getStoredKnowledgeBaseId();

  const loadFolderContents = useCallback(
    async (nodeId: string, path: string) => {
      // Check the cache
      const cached = folderCache[nodeId];
      if (cached && cached.path === path) {
        return cached.contents;
      }

      // If we're already loading this folder, wait for it
      if (loadingFolders.has(nodeId)) {
        return folderCache[nodeId]?.contents || [];
      }

      setLoadingFolders((prev) => new Set([...prev, nodeId]));

      try {
        // Fetch directly from the API instead of using listFiles
        const { data } = await axios.get<{ data: GoogleDriveFile[] }>(
          `/api/knowledge-base/${knowledgeBaseId}/files?resourcePath=${encodeURIComponent(
            path
          )}`
        );

        const contents = data.data || [];

        // Cache the results
        setFolderCache((prev) => ({
          ...prev,
          [nodeId]: {
            contents,
            path,
          },
        }));

        return contents;
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
    [knowledgeBaseId, folderCache]
  );

  const clearCache = useCallback(() => {
    setFolderCache({});
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
    isLoading,
    getFolderContents,
  };
}
