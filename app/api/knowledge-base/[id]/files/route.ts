import { NextRequest } from "next/server";
import { apiClient } from "@/app/utils/api-client";
import { AxiosResponse } from "axios";
import { KnowledgeBaseFile } from "@/app/hooks/useKnowledgeBaseFiles";
import { createApiResponse, handleApiError } from "@/app/utils/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resourcePath = searchParams.get("resourcePath") || "/";
    const knowledgeBaseId = (await params).id;

    // Get files from knowledge base using the correct path format
    const { data } = await apiClient.get<AxiosResponse<KnowledgeBaseFile[]>>(
      `/knowledge_bases/${knowledgeBaseId}/resources/children`,
      {
        params: {
          resource_path: resourcePath,
        },
      }
    );

    return createApiResponse(data.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { resourcePath } = body;
    const knowledgeBaseId = (await params).id;

    if (!resourcePath) {
      throw new Error("resourcePath is required");
    }

    const url = `/knowledge_bases/${knowledgeBaseId}/resources?resource_path=${resourcePath}`;
    await apiClient.delete(url);

    return createApiResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
