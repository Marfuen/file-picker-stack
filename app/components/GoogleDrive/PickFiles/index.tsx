"use client";

import { useState, useCallback } from "react";
import { FileList } from "./FileList";
import { SelectAll } from "./SelectAll";
import { useGoogleDriveFiles } from "@/app/hooks/useGoogleDriveFiles";
import { useKnowledgeBase } from "@/app/hooks/useKnowledgeBase";
import { getAllResourceIds } from "@/app/utils/file-tree";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKnowledgeBaseActions } from "@/app/hooks/useKnowledgeBaseActions";
import { FileTreeNode } from "@/app/types/file-system";

export interface PickFilesProps {
  onCreateKnowledgeBase: (callback: () => Promise<void>) => Promise<void>;
  isCreatingKnowledgeBase: boolean;
}

export function PickFiles({
  onCreateKnowledgeBase,
  isCreatingKnowledgeBase,
}: PickFilesProps) {
  // State
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(
    new Set()
  );

  // Hooks
  const { files, isLoading, error: filesError } = useGoogleDriveFiles();
  const { knowledgeBaseId } = useKnowledgeBase();
  const { createKnowledgeBase } = useKnowledgeBaseActions();

  // Handlers
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
      node: FileTreeNode,
      resourceId: string,
      checked: boolean,
      childResourceIds?: string[]
    ) => {
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        // If it's a directory, only add/remove the directory ID
        if (node.file.inode_type === "directory") {
          if (checked) {
            next.add(resourceId);
          } else {
            next.delete(resourceId);
          }
        } else {
          // For files, include the file and its children (if any)
          const ids = [resourceId, ...(childResourceIds || [])];
          ids.forEach((id) => {
            if (checked) {
              next.add(id);
            } else {
              next.delete(id);
            }
          });
        }

        // Update selection count
        requestAnimationFrame(() => handleSelectionChange(next.size));
        return next;
      });
    },
    [handleSelectionChange]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!files) return;

      const allResourceIds = checked
        ? getAllResourceIds(files)
        : new Set<string>();
      setSelectedFiles(allResourceIds);
      setIsAllSelected(checked);
    },
    [files]
  );

  const handleAddOrCreateKnowledgeBase = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    setProcessingFiles(new Set(selectedFiles));

    try {
      await onCreateKnowledgeBase(async () => {
        await createKnowledgeBase({
          name: "Mariano's knowledge base",
          description: "Mariano's knowledge base",
          connectionSourceIds: Array.from(selectedFiles),
        });
        setSelectedFiles(new Set());
      });
    } catch (error) {
      console.error("Failed to process knowledge base operation:", error);
    } finally {
      setProcessingFiles(new Set());
    }
  }, [selectedFiles, createKnowledgeBase, onCreateKnowledgeBase]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (filesError) {
    return (
      <div className="flex flex-col gap-4 px-2">
        <div className="text-destructive">
          Error loading files: {filesError.error}
        </div>
      </div>
    );
  }

  const buttonText = isCreatingKnowledgeBase ? (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {knowledgeBaseId ? "Adding files..." : "Creating knowledge base..."}
    </div>
  ) : knowledgeBaseId ? (
    `Add files (${selectedFiles.size} files)`
  ) : (
    `Create knowledge base (${selectedFiles.size} files)`
  );

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">
          Pick files from your Google Drive
        </h1>
        <p className="text-sm text-muted-foreground">
          Select the files you want to add to your knowledge base. You can
          select all files or select specific files.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <SelectAll
            selectedCount={selectedFiles.size}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
          />
          <FileList
            onSelectionChange={handleSelectionChange}
            files={files ?? []}
            selectedFiles={selectedFiles}
            processingFiles={processingFiles}
            onSelect={handleSelect}
          />
        </CardContent>
      </Card>
      <Button
        onClick={handleAddOrCreateKnowledgeBase}
        disabled={selectedFiles.size === 0 || isCreatingKnowledgeBase}
      >
        {buttonText}
      </Button>
    </div>
  );
}
