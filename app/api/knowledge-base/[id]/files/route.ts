"use server";

import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/app/utils/api-client";
import { AxiosError } from "axios";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resourcePath = searchParams.get("resourcePath") || "/";
    const knowledgeBaseId = params.id;

    // Get files from knowledge base using the correct path format
    const { data } = await apiClient.get(
      `/knowledge_bases/${knowledgeBaseId}/resources/children`,
      {
        params: {
          resource_path: resourcePath,
        },
      }
    );

    return NextResponse.json(data);
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

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resourcePath = searchParams.get("resourcePath");
    const knowledgeBaseId = params.id;

    if (!resourcePath) {
      return NextResponse.json(
        { error: "resourcePath is required" },
        { status: 400 }
      );
    }

    // Delete file from knowledge base
    await apiClient.delete(`/knowledge_bases/${knowledgeBaseId}/resources`, {
      params: {
        resource_path: resourcePath,
      },
    });

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
