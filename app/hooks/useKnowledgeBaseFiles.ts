import useSWR from "swr";
import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";

export interface KnowledgeBaseFile {
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

interface UseKnowledgeBaseFilesParams {
  path?: string;
  filterByParent?: boolean;
}

interface UseKnowledgeBaseFilesError {
  error: string;
  status?: number;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw {
      error: error.error || "Failed to fetch files",
      status: response.status,
    };
  }
  return response.json();
};

export function useKnowledgeBaseFiles({
  path,
  filterByParent = false,
}: UseKnowledgeBaseFilesParams = {}) {
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();
  const queryParams = new URLSearchParams();
  if (path) queryParams.set("resourcePath", path);
  if (filterByParent) queryParams.set("filterByParent", "true");

  const { data, error, isLoading, mutate } = useSWR<
    KnowledgeBaseFile[],
    UseKnowledgeBaseFilesError
  >(
    knowledgeBaseId
      ? `/api/knowledge-base/${knowledgeBaseId}/files?${queryParams.toString()}`
      : null,
    fetcher
  );

  const isUnauthorized = error?.status === 401;

  return {
    files: data || [],
    error,
    isLoading,
    isUnauthorized,
    mutate,
  };
}
