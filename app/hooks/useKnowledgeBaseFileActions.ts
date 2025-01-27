import { useState } from "react";
import axios from "axios";
import { apiClient } from "@/app/utils/api-client";
import { getSession } from "@/app/utils/session";
import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";

export function useKnowledgeBaseFileActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();

  const deleteFile = async (path: string) => {
    if (!knowledgeBaseId) return false;

    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/knowledge-base/${knowledgeBaseId}/files`, {
        data: { resourcePath: path },
      });
      return true;
    } catch (err) {
      const error = new Error(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to delete file"
      );
      setError(error);
      console.error("Error deleting file:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async () => {
    if (!knowledgeBaseId) return;

    setIsLoading(true);
    setError(null);
    try {
      const session = await getSession();
      await apiClient.get(
        `/knowledge_bases/sync/trigger/${knowledgeBaseId}/${session.orgId}`
      );
    } catch (err) {
      const error = new Error(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to trigger sync"
      );
      setError(error);
      console.error("Failed to trigger sync:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteFile,
    triggerSync,
    isLoading,
    error,
  };
}
