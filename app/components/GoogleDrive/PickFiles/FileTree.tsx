"use client";

import { useFileTree } from "@/app/hooks/useFileTree";
import { useLocalKnowledgeBaseStore } from "@/app/stores/local-knowledge-base";
import { BaseFileTreeProps, FileTreeNode } from "@/app/types/file-system";
import { buildFileTree, sortFileNodes } from "@/app/utils/file-tree";
import { Accordion } from "@/components/ui/accordion";
import { useCallback, type ReactElement } from "react";
import { FileTreeDirectory } from "./FileTreeDirectory";
import { FileTreeFile } from "./FileTreeFile";

interface FileTreeProps extends BaseFileTreeProps {
  onKnowledgeBaseFilesLoad?: (path: string, fileIds: Set<string>) => void;
}

export function FileTree({
  files,
  selectedFiles,
  onSelect,
  onKnowledgeBaseFilesLoad,
  processingFiles,
  onFileDeleted,
  isKnowledgeBase = false,
}: FileTreeProps): ReactElement {
  const { knowledgeBaseId } = useLocalKnowledgeBaseStore();
  const {
    openFolders,
    getNodeId,
    getFolderContentsForNode,
    createFileNode,
    getAllChildResourceIds,
    toggleFolder,
    isNodeLoading,
  } = useFileTree({
    isKnowledgeBase,
    onKnowledgeBaseFilesLoad,
    knowledgeBaseId: knowledgeBaseId || undefined,
  });

  const handleSelect = useCallback(
    (node: FileTreeNode, resourceId: string, checked: boolean) => {
      const childResourceIds = getAllChildResourceIds(node);
      onSelect?.(node, resourceId, checked, childResourceIds);
    },
    [getAllChildResourceIds, onSelect]
  );

  const renderFileNode = useCallback(
    (node: FileTreeNode, path: string, depth = 0): ReactElement => {
      const nodeId = getNodeId(node);
      const isSelected = selectedFiles?.has(nodeId) ?? false;

      if (node.file.inode_type === "directory") {
        return (
          <FileTreeDirectory
            key={nodeId}
            node={node}
            path={path}
            depth={depth}
            isSelected={isSelected}
            isLoading={isNodeLoading(nodeId)}
            directoryContents={getFolderContentsForNode(nodeId)}
            childNodes={node.children}
            processingFiles={processingFiles}
            onFileDeleted={onFileDeleted}
            isKnowledgeBase={isKnowledgeBase}
            onSelect={handleSelect}
            onToggle={toggleFolder}
            createFileNode={createFileNode}
            getNodeId={getNodeId}
            renderFileNode={renderFileNode}
          />
        );
      }

      return (
        <FileTreeFile
          key={nodeId}
          node={node}
          depth={depth}
          isSelected={isSelected}
          processingFiles={processingFiles}
          onFileDeleted={onFileDeleted}
          isKnowledgeBase={isKnowledgeBase}
          onSelect={handleSelect}
        />
      );
    },
    [
      getNodeId,
      selectedFiles,
      isNodeLoading,
      getFolderContentsForNode,
      processingFiles,
      onFileDeleted,
      isKnowledgeBase,
      handleSelect,
      toggleFolder,
      createFileNode,
    ]
  );

  const fileTree = buildFileTree(files);

  return (
    <Accordion
      type="multiple"
      value={Array.from(openFolders)}
      className="w-full"
    >
      {sortFileNodes(Object.entries(fileTree)).map(([name, node]) =>
        renderFileNode(node, name)
      )}
    </Accordion>
  );
}
