"use client";

import { useKnowledgeBase } from "@/app/hooks/useKnowledgeBase";
import { FileTree } from "../GoogleDrive/PickFiles/FileTree";
import { useState, useCallback } from "react";
import { FileNode } from "@/app/types/google-drive-ui";
import { Loader2 } from "lucide-react";
import { GoogleDriveFile } from "@/app/types/google-drive";

export function KnowledgeBaseView() {
  const { files, isLoading, error } = useKnowledgeBase();
  const [folderContents, setFolderContents] = useState<
    Record<string, GoogleDriveFile[]>
  >({});
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const handleFolderLoad = useCallback(
    (resourceId: string, contents: GoogleDriveFile[]) => {
      setFolderContents((prev) => ({
        ...prev,
        [resourceId]: contents,
      }));
    },
    []
  );

  const handleSelect = useCallback(
    (node: FileNode, resourceId: string, checked: boolean) => {
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(resourceId);
        } else {
          next.delete(resourceId);
        }
        return next;
      });
    },
    []
  );

  const handleFileDeleted = useCallback((resourceId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.delete(resourceId);
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-2">
        <div className="text-destructive">
          Error loading knowledge base: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2">
      <FileTree
        files={files as unknown as GoogleDriveFile[]}
        selectedFiles={selectedFiles}
        onSelect={handleSelect}
        folderContents={folderContents}
        onFolderLoad={handleFolderLoad}
        onFileDeleted={handleFileDeleted}
        isKnowledgeBase={true}
      />
    </div>
  );
}
