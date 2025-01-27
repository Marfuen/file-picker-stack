"use client";

import { useGoogleDriveFiles } from "@/app/hooks/useGoogleDriveFiles";
import { useKnowledgeBaseActions } from "@/app/hooks/useKnowledgeBaseActions";
import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";
import { FileTreeNode } from "@/app/types/file-system";
import { getAllResourceIds } from "@/app/utils/file-tree";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { FileList } from "./FileList";
import { SelectAll } from "./SelectAll";

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
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(
    new Set()
  );

  // Hooks
  const { files, isLoading, error: filesError } = useGoogleDriveFiles();
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();
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
    (node: FileTreeNode, resourceId: string, checked: boolean) => {
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        const path = node.file.inode_path.path;

        if (checked) {
          next.add(resourceId);
          setSelectedPaths((prev) => new Set([...prev, path]));
        } else {
          next.delete(resourceId);
          setSelectedPaths((prev) => {
            const next = new Set(prev);
            next.delete(path);
            return next;
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

      const allPaths = checked
        ? new Set(files.map((f) => f.inode_path.path))
        : new Set<string>();

      setSelectedFiles(allResourceIds);
      setSelectedPaths(allPaths);
      setIsAllSelected(checked);
    },
    [files]
  );

  const getEffectiveSelections = useCallback(() => {
    const effectiveSelections = new Set<string>();

    // Helper function to check if a path is a child of any selected paths
    const isChildOfSelectedPath = (path: string) => {
      for (const selectedPath of selectedPaths) {
        if (path !== selectedPath && path.startsWith(selectedPath + "/")) {
          return true;
        }
      }
      return false;
    };

    // Add only files that aren't children of selected folders
    selectedFiles.forEach((resourceId) => {
      const file = files?.find((f) => f.resource_id === resourceId);
      if (file && !isChildOfSelectedPath(file.inode_path.path)) {
        effectiveSelections.add(resourceId);
      }
    });

    return effectiveSelections;
  }, [selectedFiles, selectedPaths, files]);

  const handleAddOrCreateKnowledgeBase = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    const effectiveSelections = getEffectiveSelections();
    setProcessingFiles(effectiveSelections);

    try {
      await onCreateKnowledgeBase(async () => {
        console.log(["Effective selections", effectiveSelections]);
        await createKnowledgeBase({
          name: "Mariano's knowledge base",
          description: "Mariano's knowledge base",
          connectionSourceIds: Array.from(effectiveSelections),
        });
        setSelectedFiles(new Set());
        setSelectedPaths(new Set());
      });
    } catch (error) {
      console.error("Failed to process knowledge base operation:", error);
    } finally {
      setProcessingFiles(new Set());
    }
  }, [
    selectedFiles,
    createKnowledgeBase,
    onCreateKnowledgeBase,
    getEffectiveSelections,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:px-2">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (filesError) {
    return (
      <div className="flex flex-col gap-4 p-4 md:px-2">
        <div className="text-destructive">
          Error loading files: {filesError.error}
        </div>
      </div>
    );
  }

  const effectiveSelections = getEffectiveSelections();
  const buttonText = isCreatingKnowledgeBase ? (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {knowledgeBaseId ? "Adding files..." : "Creating knowledge base..."}
    </div>
  ) : knowledgeBaseId ? (
    `Add files (${effectiveSelections.size} files)`
  ) : (
    `Create knowledge base (${effectiveSelections.size} files)`
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:px-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-bold">
          Pick files from your Google Drive
        </h1>
        <p className="text-sm text-muted-foreground">
          Select the files you want to add to your knowledge base. You can
          select all files or select specific files.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Files</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <SelectAll
            selectedCount={effectiveSelections.size}
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
        disabled={effectiveSelections.size === 0 || isCreatingKnowledgeBase}
        className="w-full md:w-auto"
      >
        {buttonText}
      </Button>
    </div>
  );
}
