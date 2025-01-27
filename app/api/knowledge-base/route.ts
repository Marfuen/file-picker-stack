import { getSession } from "@/app/utils/session";
import { apiClient } from "@/app/utils/api-client";
import { KnowledgeBaseResponse } from "@/app/types/knowledge-base";
import { createApiResponse, handleApiError } from "@/app/utils/api-helpers";
import { AxiosResponse } from "axios";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");

    if (!knowledgeBaseId) {
      throw new Error("knowledgeBaseId is required");
    }

    const { data: knowledgeBase } = await apiClient.get<
      AxiosResponse<KnowledgeBaseResponse>
    >(`/knowledge_bases/${knowledgeBaseId}`);
    return createApiResponse(knowledgeBase.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.connection) {
      throw new Error("Google Drive connection not found");
    }

    const body = await request.json();
    const { connectionSourceIds, name, description } = body;

    if (!connectionSourceIds?.length) {
      throw new Error("connectionSourceIds is required");
    }

    if (!name) {
      throw new Error("name is required");
    }

    // Create knowledge base
    const data = {
      connection_id: session.connection.connectionId,
      connection_source_ids: connectionSourceIds,
      name,
      description,
      indexing_params: {
        ocr: false,
        unstructured: true,
        embedding_params: {
          embedding_model: "text-embedding-ada-002",
          api_key: null,
        },
        chunker_params: {
          chunk_size: 1500,
          chunk_overlap: 500,
          chunker: "sentence",
        },
      },
    };

    // Create knowledge base and trigger sync in parallel
    const { data: knowledgeBase } = await apiClient.post<KnowledgeBaseResponse>(
      "/knowledge_bases",
      data
    );

    await apiClient.get(
      `/knowledge_bases/sync/trigger/${knowledgeBase.knowledge_base_id}/${session.orgId}`
    );

    return createApiResponse(knowledgeBase);
  } catch (error) {
    return handleApiError(error);
  }
}
