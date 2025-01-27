"use server";

import { GoogleDriveFilesResponse } from "@/app/types/google-drive";
import { apiClient } from "@/app/utils/api-client";
import { getSession } from "@/app/utils/session";
import { createApiResponse, handleApiError } from "@/app/utils/api-helpers";

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const sortOrder = searchParams.get("sort") || "desc";

    // Get session (includes org and connection info)
    const session = await getSession();

    if (!session.connection) {
      throw new Error("Google Drive connection not found");
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

    return createApiResponse(sortedFiles);
  } catch (error) {
    return handleApiError(error);
  }
}
