"use client";

import { sortFileNodes } from "@/app/utils/file-tree";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FileView } from "./FileView";
import { FileTreeSkeleton } from "./FileTreeSkeleton";
import { type ReactElement } from "react";
import {
  FileSystemNode,
  FileTreeNode,
  FileViewProps,
} from "@/app/types/file-system";

interface FileTreeDirectoryProps
  extends Omit<FileViewProps, "isSelected" | "node"> {
  node: FileTreeNode;
  path: string;
  isSelected: boolean;
  isLoading: boolean;
  directoryContents: FileSystemNode[] | null;
  childNodes: Record<string, FileTreeNode>;
  onToggle: (node: FileTreeNode) => void;
  createFileNode: (file: FileSystemNode) => FileTreeNode;
  getNodeId: (node: FileTreeNode) => string;
  renderFileNode: (
    node: FileTreeNode,
    path: string,
    depth: number
  ) => ReactElement;
}

export function FileTreeDirectory({
  node,
  path,
  depth = 0,
  isSelected,
  isLoading,
  directoryContents,
  childNodes,
  processingFiles,
  onFileDeleted,
  isKnowledgeBase = false,
  onSelect,
  onToggle,
  createFileNode,
  getNodeId,
  renderFileNode,
}: FileTreeDirectoryProps): ReactElement {
  const nodeId = getNodeId(node);
  const hasChildren =
    Object.keys(childNodes).length > 0 ||
    (directoryContents && directoryContents.length > 0);

  return (
    <AccordionItem value={nodeId} key={nodeId} className="border-none">
      <AccordionTrigger
        className={cn(
          "hover:no-underline py-0 [&>svg]:hidden group w-full cursor-pointer p-2",
          isSelected && "bg-muted"
        )}
        onClick={(e) => {
          e.preventDefault();
          onToggle(node);
        }}
      >
        <div className="flex items-center w-full">
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
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        {isLoading ? (
          <FileTreeSkeleton depth={depth} />
        ) : directoryContents ? (
          sortFileNodes(
            directoryContents.map((file) => {
              const name = file.inode_path.path.split("/").pop() || "";
              return [name, createFileNode(file)];
            })
          ).map(([childPath, childNode]) =>
            renderFileNode(childNode, `${path}/${childPath}`, depth + 1)
          )
        ) : (
          hasChildren &&
          sortFileNodes(Object.entries(childNodes)).map(
            ([childPath, childNode]) =>
              renderFileNode(childNode, `${path}/${childPath}`, depth + 1)
          )
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
