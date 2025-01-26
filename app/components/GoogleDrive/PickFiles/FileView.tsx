"use client";

import { FileViewProps } from "@/app/types/google-drive-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import {
  ChevronRight,
  FileText,
  Folder,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { formatFileSize } from "@/app/utils/file-tree";
import { cn } from "@/lib/utils";
import { useKnowledgeBase } from "@/app/hooks/useKnowledgeBase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExtendedFileViewProps extends FileViewProps {
  isInKnowledgeBase?: boolean;
  isAccordionTrigger?: boolean;
}

export function FileView({
  node,
  isSelected,
  depth = 0,
  onSelect,
  isInKnowledgeBase,
  isAccordionTrigger = false,
}: ExtendedFileViewProps) {
  const isDirectory = node.file.inode_type === "directory";
  const fileName = node.file.inode_path.path.split("/").pop() || "";
  const { deleteFile } = useKnowledgeBase();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteFile(node.file.inode_path.path);
      toast.success("File removed from knowledge base");
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast.error("Failed to remove file from knowledge base");
    } finally {
      setIsDeleting(false);
    }
  };

  const content = (
    <>
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelect(node, node.file.resource_id, checked === true)
          }
        />
        {isDirectory ? (
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            <Folder className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-4" /> {/* Spacer for alignment */}
            <FileText className="w-4 h-4 text-gray-500 shrink-0" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{fileName}</p>
        {node.file.modified_time && (
          <p className="text-xs text-muted-foreground">
            Modified {format(new Date(node.file.modified_time), "PPp")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {node.file.size && (
          <div className="text-xs text-muted-foreground">
            {formatFileSize(node.file.size)}
          </div>
        )}
        {!isDirectory && isInKnowledgeBase && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );

  if (isAccordionTrigger) {
    return <div className="flex items-center gap-2 w-full">{content}</div>;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-4 group",
        isSelected && "bg-muted"
      )}
      style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}
    >
      {content}
    </div>
  );
}
