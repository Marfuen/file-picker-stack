import { NextResponse } from "next/server";
import { getSession } from "@/app/utils/session";
import { apiClient } from "@/app/utils/api-client";
import { KnowledgeBaseResponse } from "@/app/types/knowledge-base";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const knowledgeBaseId = searchParams.get("knowledgeBaseId");
  const { data: knowledgeBase } = await apiClient.get<KnowledgeBaseResponse>(
    `/knowledge_bases/${knowledgeBaseId}`
  );
  console.log("[GET] knowledgeBase", knowledgeBase);
  return NextResponse.json(knowledgeBase);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.connection) {
      return NextResponse.json(
        { error: "Google Drive connection not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { connectionSourceIds, name, description } = body;

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

    return NextResponse.json(knowledgeBase);
  } catch (error) {
    console.error("Error creating knowledge base:", error);

    if (error instanceof Error) {
      const status = error.message.includes("Authentication") ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Failed to create knowledge base" },
      { status: 500 }
    );
  }
}
