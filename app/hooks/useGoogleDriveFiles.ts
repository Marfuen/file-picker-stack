import useSWR from "swr";
import { GoogleDriveFile } from "../types/google-drive";

interface UseGoogleDriveFilesParams {
  resourceId?: string;
  search?: string;
  sort?: "asc" | "desc";
}

interface UseGoogleDriveFilesError {
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

export function useGoogleDriveFiles({
  resourceId,
  search,
  sort = "desc",
}: UseGoogleDriveFilesParams = {}) {
  const queryParams = new URLSearchParams();
  if (resourceId) queryParams.set("resourceId", resourceId);
  if (search) queryParams.set("search", search);
  if (sort) queryParams.set("sort", sort);

  const { data, error, isLoading, mutate } = useSWR<
    GoogleDriveFile[],
    UseGoogleDriveFilesError
  >(`/api/google-drive/files?${queryParams.toString()}`, fetcher);

  const isUnauthorized = error?.status === 401;

  return {
    files: data || [],
    error,
    isLoading,
    isUnauthorized,
    mutate,
  };
}
