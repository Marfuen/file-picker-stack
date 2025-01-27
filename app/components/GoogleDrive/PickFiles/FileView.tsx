"use client";

import { FileViewProps } from "@/app/types/file-system";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight,
  FileText,
  Folder,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatFileSize } from "@/app/utils/file-tree";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useKnowledgeBaseFileActions } from "@/app/hooks/useKnowledgeBaseFileActions";
import { type ReactElement } from "react";

type FileViewInternalProps = Omit<FileViewProps, "triggerLoad">;

export function FileView({
  node,
  isSelected,
  depth = 0,
  onSelect,
  processingFiles,
  onFileDeleted,
  isKnowledgeBase = false,
}: FileViewInternalProps): ReactElement {
  const isDirectory = node.file.inode_type === "directory";
  const fileName = node.file.inode_path.path.split("/").pop() || "";
  const { deleteFile } = useKnowledgeBaseFileActions();
  const [isDeleting, setIsDeleting] = useState(false);
  const isProcessing =
    processingFiles?.has(node.file.resource_id) || isDeleting;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await deleteFile(node.file.inode_path.path);
      if (success) {
        onFileDeleted?.(node.file.resource_id, node.file.inode_path.path);
        toast.success(
          `Successfully removed ${node.file.inode_path.path} from knowledge base`
        );
      } else {
        toast.error(
          `Failed to remove ${node.file.inode_path.path} from knowledge base`
        );
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast.error("Failed to remove from knowledge base");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 md:gap-2 flex-1 min-w-0",
        !isDirectory && "py-1 md:py-2 px-1 md:px-2"
      )}
    >
      <div
        className="flex items-center gap-1 md:gap-2 shrink-0"
        style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }}
      >
        {!isKnowledgeBase && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              onSelect(node, node.file.resource_id, checked === true)
            }
            disabled={isProcessing}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 h-3 w-3 md:h-4 md:w-4"
          />
        )}
        {isDirectory ? (
          <div className="flex items-center gap-1 md:gap-2">
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            <Folder className="w-3 h-3 md:w-4 md:h-4 text-blue-500 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-3 md:w-4" /> {/* Spacer for alignment */}
            <FileText className="w-3 h-3 md:w-4 md:h-4 text-gray-500 shrink-0" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="truncate text-xs md:text-sm font-medium">{fileName}</p>
      </div>
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {node.file.size && (
          <div className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
            {formatFileSize(node.file.size)}
          </div>
        )}
      </div>
      {isKnowledgeBase && !isDirectory && (
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500 shrink-0" />
        </div>
      )}
      {isKnowledgeBase && !isDirectory && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground hover:text-destructive shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={isProcessing}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
