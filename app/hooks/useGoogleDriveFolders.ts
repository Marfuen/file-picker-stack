"use client";

import { useState, useCallback } from "react";
import { GoogleDriveFile } from "@/app/types/google-drive";
import axios from "axios";

interface FolderCache {
  [nodeId: string]: {
    contents: GoogleDriveFile[];
    path: string;
  };
}

export function useGoogleDriveFolders() {
  const [folderCache, setFolderCache] = useState<FolderCache>({});
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  const loadFolderContents = useCallback(
    async (nodeId: string, resourceId: string) => {
      // Check the cache
      const cached = folderCache[nodeId];
      if (cached) {
        return cached.contents;
      }

      // If we're already loading this folder, wait for it
      if (loadingFolders.has(nodeId)) {
        return folderCache[nodeId]?.contents || [];
      }

      setLoadingFolders((prev) => new Set([...prev, nodeId]));

      try {
        const { data } = await axios.get<GoogleDriveFile[]>(
          `/api/google-drive/files?resourceId=${resourceId}`
        );

        // Cache the results
        setFolderCache((prev) => ({
          ...prev,
          [nodeId]: {
            contents: data,
            path: resourceId,
          },
        }));

        return data;
      } catch (error) {
        console.error("Error loading Google Drive folder contents:", error);
        return [];
      } finally {
        setLoadingFolders((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      }
    },
    [folderCache, loadingFolders]
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
