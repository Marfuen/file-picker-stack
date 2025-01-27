import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/app/utils/api-client";
import { AxiosError, AxiosResponse } from "axios";
import { KnowledgeBaseFile } from "@/app/hooks/useKnowledgeBaseFiles";

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

    return NextResponse.json(data.data);
  } catch (error) {
    console.error("Error fetching knowledge base files:", error);

    // If the error is a 400, return an empty array. It seems the api throws a 400 if the resource doesn't exist.
    if (error instanceof AxiosError && error.response?.status === 400) {
      return NextResponse.json([]);
    }

    if (error instanceof Error) {
      // Return 404 for "not found" errors, 401 for auth errors, 500 for others
      const status = error.message.includes("not found")
        ? 404
        : error.message.includes("Authentication")
        ? 401
        : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Failed to fetch knowledge base files" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "resourcePath is required" },
        { status: 400 }
      );
    }

    console.log("[DELETE] knowledgeBaseId", knowledgeBaseId);
    console.log("[DELETE] resourcePath", resourcePath);
    const url = `/knowledge_bases/${knowledgeBaseId}/resources?resource_path=${resourcePath}`;
    console.log("[DELETE] url", url);

    // Delete file from knowledge base
    await apiClient.delete(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file from knowledge base:", error);

    if (error instanceof Error) {
      const status = error.message.includes("Authentication") ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Failed to delete file from knowledge base" },
      { status: 500 }
    );
  }
}
