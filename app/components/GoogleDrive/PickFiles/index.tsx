"use client";

import { FileList } from "./FileList";
import { SelectAll } from "./SelectAll";
import { useState, useCallback, useRef } from "react";
import { useGoogleDriveFiles } from "@/app/hooks/useGoogleDriveFiles";
import { getAllResourceIds } from "@/app/utils/file-tree";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKnowledgeBase } from "@/app/hooks/useKnowledgeBase";
import { FileNode } from "@/app/types/google-drive-ui";

interface FileListRef {
  selectAll: (checked: boolean) => void;
}

export const PickFiles = () => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const fileListRef = useRef<FileListRef>(null);
  const { files, isLoading } = useGoogleDriveFiles();
  const {
    createKnowledgeBase,
    getStoredKnowledgeBaseId,
    files: knowledgeBaseFiles,
    isLoading: isLoadingFiles,
    error: filesError,
  } = useKnowledgeBase();

  console.log("[PickFiles] knowledgeBaseFiles", knowledgeBaseFiles);

  // Track knowledge base files by path
  const [knowledgeBaseFilesByPath, setKnowledgeBaseFilesByPath] = useState<
    Map<string, Set<string>>
  >(new Map());

  const knowledgeBaseId = getStoredKnowledgeBaseId();
  const hasKnowledgeBaseId = knowledgeBaseId !== null;

  // Combine root knowledge base files with folder-specific files
  const allKnowledgeBaseFileIds = new Set([
    ...knowledgeBaseFiles.map((file) => file.inode_path.path),
    ...[...knowledgeBaseFilesByPath.values()].flatMap((set) => [...set]),
  ]);

  const handleKnowledgeBaseFilesLoad = useCallback(
    (path: string, fileIds: Set<string>) => {
      setKnowledgeBaseFilesByPath((prev) => {
        const next = new Map(prev);
        next.set(path, fileIds);
        return next;
      });
    },
    []
  );

  const handleAddOrCreateKnowledgeBase = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    try {
      await createKnowledgeBase({
        name: "Mariano's knowledge base",
        description: "Mariano's knowledge base",
        connectionSourceIds: Array.from(selectedFiles.values()),
      });

      // Clear selection after successful operation
      setSelectedFiles(new Set());
    } catch (error) {
      console.error("Failed to process knowledge base operation:", error);
      // Here you could add a toast notification for the error
    }
  }, [selectedFiles, createKnowledgeBase]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!files) return;

      if (checked) {
        const allResourceIds = getAllResourceIds(files);
        setSelectedFiles(allResourceIds);
        setIsAllSelected(true);
      } else {
        setSelectedFiles(new Set());
        setIsAllSelected(false);
      }
    },
    [files]
  );

  const handleSelectionChange = useCallback(
    (count: number) => {
      if (!files) return;

      const totalFiles = getAllResourceIds(files).size;
      setIsAllSelected(count === totalFiles && totalFiles > 0);
    },
    [files]
  );

  const handleSelect = useCallback(
    (
      node: FileNode,
      resourceId: string,
      checked: boolean,
      childResourceIds?: string[]
    ) => {
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(resourceId);
          if (childResourceIds) {
            childResourceIds.forEach((id) => next.add(id));
          }
        } else {
          next.delete(resourceId);
          if (childResourceIds) {
            childResourceIds.forEach((id) => next.delete(id));
          }
        }
        // Call handleSelectionChange with the new count
        setTimeout(() => handleSelectionChange(next.size), 0);
        return next;
      });
    },
    [handleSelectionChange]
  );

  if (isLoading || isLoadingFiles) {
    return (
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  if (filesError) {
    return (
      <div className="flex flex-col gap-4 px-2">
        <div className="text-destructive">
          Error loading files: {filesError.message}
        </div>
      </div>
    );
  }

  console.log("[PickFiles] selectedFiles", selectedFiles);
  console.log("[PickFiles] knowledgeBaseFiles", knowledgeBaseFiles);

  return (
    <div className="flex flex-col gap-4 px-2">
      <SelectAll
        selectedCount={selectedFiles.size}
        onSelectAll={handleSelectAll}
        isAllSelected={isAllSelected}
      />
      <FileList
        ref={fileListRef}
        onSelectionChange={handleSelectionChange}
        files={files ?? []}
        selectedFiles={selectedFiles}
        onSelect={handleSelect}
        knowledgeBaseFileIds={
          hasKnowledgeBaseId ? allKnowledgeBaseFileIds : undefined
        }
        onKnowledgeBaseFilesLoad={handleKnowledgeBaseFilesLoad}
      />
      <Button
        onClick={handleAddOrCreateKnowledgeBase}
        disabled={selectedFiles.size === 0}
      >
        {hasKnowledgeBaseId
          ? `Add files (${selectedFiles.size} files)`
          : `Create knowledge base (${selectedFiles.size} files)`}
      </Button>
    </div>
  );
};
