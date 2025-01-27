"use client";

import { FileViewProps } from "@/app/types/file-system";
import { FileView } from "./FileView";
import { type ReactElement } from "react";

type FileTreeFileProps = FileViewProps;

export function FileTreeFile({
  node,
  depth,
  isSelected,
  processingFiles,
  onFileDeleted,
  isKnowledgeBase = false,
  onSelect,
}: FileTreeFileProps): ReactElement {
  return (
    <div className="group hover:bg-muted">
      <FileView
        node={node}
        isSelected={isSelected}
        depth={depth}
        onSelect={onSelect}
        processingFiles={processingFiles}
        onFileDeleted={onFileDeleted}
        isKnowledgeBase={isKnowledgeBase}
      />
    </div>
  );
}
