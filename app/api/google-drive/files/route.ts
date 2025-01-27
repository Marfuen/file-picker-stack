"use server";

import { GoogleDriveFilesResponse } from "@/app/types/google-drive";
import { apiClient } from "@/app/utils/api-client";
import { getSession } from "@/app/utils/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const sortOrder = searchParams.get("sort") || "desc";

    // Get session (includes org and connection info)
    const session = await getSession();

    if (!session.connection) {
      return NextResponse.json(
        { error: "Google Drive connection not found" },
        { status: 404 }
      );
    }

    // Get files
    const { data: files } = await apiClient.get<GoogleDriveFilesResponse>(
      `/connections/${session.connection.connectionId}/resources/children${
        resourceId ? `?resource_id=${resourceId}` : ""
      }`
    );

    // Sort files
    const sortedFiles = files.data.sort((a, b) => {
      const aPath = a.inode_path.path.toLowerCase();
      const bPath = b.inode_path.path.toLowerCase();
      return sortOrder === "asc"
        ? aPath.localeCompare(bPath)
        : bPath.localeCompare(aPath);
    });

    return NextResponse.json(sortedFiles);
  } catch (error) {
    console.error("Error fetching files:", error);

    if (error instanceof Error) {
      const status = error.message.includes("Authentication") ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
