"use client";

import { useKnowledgeBaseFileActions } from "@/app/hooks/useKnowledgeBaseFileActions";
import { useKnowledgeBaseFiles } from "@/app/hooks/useKnowledgeBaseFiles";
import { useKnowledgeBaseFolders } from "@/app/hooks/useKnowledgeBaseFolders";
import { useKnowledgeBaseMutations } from "@/app/hooks/useKnowledgeBaseMutations";
import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Trash } from "lucide-react";
import { useCallback } from "react";
import { FileTree } from "../GoogleDrive/PickFiles/FileTree";

export function KnowledgeBaseView() {
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();
  const { deleteFile, isLoading: isDeleting } = useKnowledgeBaseFileActions();
  const { deleteKnowledgeBase } = useKnowledgeBaseMutations();
  const { clearCache } = useKnowledgeBaseFolders();
  const { files, isLoading, error: filesError } = useKnowledgeBaseFiles({});
  const { mutate } = useKnowledgeBaseFiles();

  const handleFileDeleted = useCallback(
    async (_resourceId: string, path: string) => {
      try {
        await deleteFile(path);
        mutate();
        clearCache();
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    },
    [deleteFile, clearCache, mutate]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:px-2">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  if (filesError) {
    const errorMessage =
      filesError instanceof Error ? filesError.message : filesError.error;
    return (
      <div className="flex flex-col gap-4 p-4 md:px-2">
        <div className="text-destructive">
          Error loading knowledge base: {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:px-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-bold">
          Manage Your Knowledge Base
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage your knowledge base. You can de-index files from this
          knowledge base.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-2 relative">
          <CardTitle>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg md:text-xl font-bold">Knowledge Base</h1>
              <p className="text-[10px] text-muted-foreground font-mono p-1 bg-muted rounded-md break-all">
                ID: {knowledgeBaseId}
              </p>
            </div>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:mt-0 absolute md:relative right-2 top-2 md:right-auto md:top-auto"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={deleteKnowledgeBase}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Knowledge Base
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <FileTree
            files={files}
            onSelect={() => {}}
            onFileDeleted={handleFileDeleted}
            processingFiles={isDeleting ? new Set([]) : undefined}
            isKnowledgeBase
          />
        </CardContent>
      </Card>
    </div>
  );
}
