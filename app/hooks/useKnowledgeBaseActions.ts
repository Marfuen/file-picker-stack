import { useState } from "react";
import axios from "axios";
import { apiClient } from "@/app/utils/api-client";
import { getSession } from "@/app/utils/session";
import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";

export interface KnowledgeBaseResponse {
  knowledge_base_id: string;
  organization_id: string;
  name: string;
  description: string;
  connection_id: string;
  connection_source_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeBaseParams {
  connectionSourceIds: string[];
  name: string;
  description: string;
}

export function useKnowledgeBaseActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { setKnowledgeBaseId, clearKnowledgeBase } =
    useLocalKnowledgeBaseStore();

  const createKnowledgeBase = async (params: CreateKnowledgeBaseParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.post<KnowledgeBaseResponse>(
        "/api/knowledge-base",
        params
      );

      setKnowledgeBaseId(data.knowledge_base_id);

      // Trigger initial sync
      const session = await getSession();
      await apiClient.get(
        `/knowledge_bases/sync/trigger/${data.knowledge_base_id}/${session.orgId}`
      );

      return data.knowledge_base_id;
    } catch (err) {
      const error = new Error(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to create knowledge base"
      );
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteKnowledgeBase = () => {
    clearKnowledgeBase();
  };

  return {
    createKnowledgeBase,
    deleteKnowledgeBase,
    isLoading,
    error,
  };
}
