"use client";

import { useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import useSWR, { mutate } from "swr";
import { getSession } from "@/app/utils/session";
import { apiClient } from "@/app/utils/api-client";

const KNOWLEDGE_BASE_ID_KEY = "knowledgeBaseId";

interface CreateKnowledgeBaseParams {
  connectionSourceIds: string[];
  name: string;
  description: string;
}

interface KnowledgeBaseFile {
  resource_id: string;
  inode_id: string;
  inode_path: {
    path: string;
  };
  inode_type: "file" | "directory";
  mime_type?: string;
  size?: number;
  last_modified?: string;
}

interface KnowledgeBaseResponse {
  knowledge_base_id: string;
  organization_id: string;
  name: string;
  description: string;
  connection_id: string;
  connection_source_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useKnowledgeBase() {
  const getStoredKnowledgeBaseId = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KNOWLEDGE_BASE_ID_KEY);
  }, []);

  const setKnowledgeBaseId = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KNOWLEDGE_BASE_ID_KEY, id);
  }, []);

  const knowledgeBaseId = getStoredKnowledgeBaseId();

  // Fetch knowledge base files
  const {
    data: filesResponse,
    error: filesError,
    mutate: mutateFiles,
  } = useSWR<{ data: KnowledgeBaseFile[] }>(
    knowledgeBaseId ? `/api/knowledge-base/${knowledgeBaseId}/files` : null,
    null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  // Create a map of all files in the knowledge base for quick lookup
  const fileMap = useMemo(() => {
    const map = new Map<string, KnowledgeBaseFile>();
    filesResponse?.data?.forEach((file) => {
      map.set(file.inode_path.path, file);
    });
    return map;
  }, [filesResponse?.data]);

  const isFileInKnowledgeBase = useCallback(
    (path: string) => {
      return fileMap.has(path);
    },
    [fileMap]
  );

  const listFiles = useCallback(
    async (resourcePath: string = "/") => {
      if (!knowledgeBaseId) return;

      try {
        // Trigger revalidation with new path
        await mutateFiles(async (currentData) => {
          const { data } = await axios.get<{ data: KnowledgeBaseFile[] }>(
            `/api/knowledge-base/${knowledgeBaseId}/files?resourcePath=${encodeURIComponent(
              resourcePath
            )}`
          );

          // If this is the root path (/), replace all files
          if (resourcePath === "/") {
            return data;
          }

          // Otherwise, merge the new files with existing ones
          const existingFiles = currentData?.data ?? [];
          const newFiles = data.data ?? [];

          // Create a map of paths to avoid duplicates
          const updatedFileMap = new Map<string, KnowledgeBaseFile>();

          // Add existing files to the map
          existingFiles.forEach((file) => {
            updatedFileMap.set(file.inode_path.path, file);
          });

          // Add or update with new files
          newFiles.forEach((file) => {
            updatedFileMap.set(file.inode_path.path, file);
          });

          return {
            data: Array.from(updatedFileMap.values()),
          };
        });
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to list knowledge base files";
        throw new Error(message);
      }
    },
    [knowledgeBaseId, mutateFiles]
  );

  // Initial fetch of root files
  useEffect(() => {
    if (knowledgeBaseId && !filesResponse) {
      listFiles("/");
    }
  }, [knowledgeBaseId, filesResponse, listFiles]);

  const triggerSync = useCallback(async () => {
    if (!knowledgeBaseId) return;

    try {
      const session = await getSession();
      await apiClient.get(
        `/knowledge_bases/sync/trigger/${knowledgeBaseId}/${session.orgId}`
      );
    } catch (err) {
      console.error("Failed to trigger sync:", err);
      throw err;
    }
  }, [knowledgeBaseId]);

  const createKnowledgeBase = useCallback(
    async (params: CreateKnowledgeBaseParams) => {
      try {
        // Check if we already have a knowledge base ID
        const existingId = getStoredKnowledgeBaseId();

        if (existingId) {
          // If we have an existing knowledge base, add the new files to it
          const session = await getSession();
          await apiClient.post(`/api/knowledge-base/${existingId}/files`, {
            resource_ids: params.connectionSourceIds,
            organization_id: session.orgId,
          });

          // Trigger a sync to process the new files
          await triggerSync();

          // Refresh the files list
          await listFiles("/");

          return existingId;
        }

        // Create new knowledge base if none exists
        const { data } = await axios.post<KnowledgeBaseResponse>(
          "/api/knowledge-base",
          params
        );
        const newKnowledgeBaseId = data.knowledge_base_id;

        // Store the new ID
        setKnowledgeBaseId(newKnowledgeBaseId);

        // Trigger revalidation of knowledge base data
        await mutate(`/api/knowledge-base/${newKnowledgeBaseId}`);

        return newKnowledgeBaseId;
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to create knowledge base";
        throw new Error(message);
      }
    },
    [getStoredKnowledgeBaseId, setKnowledgeBaseId, triggerSync, listFiles]
  );

  const deleteFile = useCallback(
    async (resourcePath: string) => {
      if (!knowledgeBaseId) return;

      try {
        await axios.delete(`/api/knowledge-base/${knowledgeBaseId}/files`, {
          data: { resourcePath },
        });

        // Revalidate files after deletion
        await mutateFiles((currentData) => {
          if (!currentData) return currentData;

          // Filter out the deleted file and any children (if it's a directory)
          const updatedFiles = currentData.data.filter((file) => {
            // Remove the exact file
            if (file.inode_path.path === resourcePath) return false;
            // Remove any children (files that start with the directory path)
            if (file.inode_path.path.startsWith(resourcePath + "/"))
              return false;
            return true;
          });

          return {
            data: updatedFiles,
          };
        });
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to delete file from knowledge base";
        throw new Error(message);
      }
    },
    [knowledgeBaseId, mutateFiles]
  );

  return {
    files: filesResponse?.data ?? [],
    isLoading: !filesError && !filesResponse,
    error: filesError,
    createKnowledgeBase,
    getStoredKnowledgeBaseId,
    listFiles,
    deleteFile,
    isFileInKnowledgeBase,
  };
}
