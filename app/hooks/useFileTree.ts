import { useState, useCallback } from "react";
import { FileSystemNode, FileTreeNode } from "@/app/types/file-system";
import { useGoogleDriveFolders } from "@/app/hooks/useGoogleDriveFolders";
import { useKnowledgeBaseFolders } from "@/app/hooks/useKnowledgeBaseFolders";

interface UseFileTreeProps {
  isKnowledgeBase?: boolean;
  onKnowledgeBaseFilesLoad?: (path: string, fileIds: Set<string>) => void;
  knowledgeBaseId?: string;
}

export function useFileTree({
  isKnowledgeBase = false,
  onKnowledgeBaseFilesLoad,
  knowledgeBaseId,
}: UseFileTreeProps = {}) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const googleDriveFolders = useGoogleDriveFolders();
  const knowledgeBaseFolders = useKnowledgeBaseFolders();

  const getNodeId = useCallback(
    (node: FileTreeNode) => {
      return isKnowledgeBase ? node.file.inode_id : node.file.resource_id;
    },
    [isKnowledgeBase]
  );

  const getFolderContentsForNode = useCallback(
    (nodeId: string): FileSystemNode[] | null => {
      if (isKnowledgeBase) {
        return knowledgeBaseFolders.getFolderContents(nodeId) || null;
      }
      return googleDriveFolders.getFolderContents(nodeId) || null;
    },
    [isKnowledgeBase, knowledgeBaseFolders, googleDriveFolders]
  );

  const createFileNode = useCallback((file: FileSystemNode): FileTreeNode => {
    return {
      file,
      children: {},
    };
  }, []);

  const getAllChildResourceIds = useCallback(
    (node: FileTreeNode): string[] => {
      const resourceIds: string[] = [];

      if (node.file.inode_type === "directory") {
        // Add resource IDs from the initial tree structure
        Object.values(node.children).forEach((childNode) => {
          resourceIds.push(getNodeId(childNode));
          resourceIds.push(...getAllChildResourceIds(childNode));
        });

        // Add resource IDs from dynamically loaded contents
        const contents = getFolderContentsForNode(getNodeId(node));
        if (contents) {
          contents.forEach((file) => {
            const childNode = createFileNode(file);
            resourceIds.push(getNodeId(childNode));

            if (file.inode_type === "directory") {
              resourceIds.push(...getAllChildResourceIds(childNode));
            }
          });
        }
      }

      return resourceIds;
    },
    [getFolderContentsForNode, createFileNode, getNodeId]
  );

  const handleFolderOpen = useCallback(
    async (node: FileTreeNode) => {
      const nodeId = getNodeId(node);

      try {
        if (isKnowledgeBase) {
          const contents = await knowledgeBaseFolders.loadFolderContents(
            nodeId,
            node.file.inode_path.path
          );
          if (contents && contents.length > 0) {
            setOpenFolders((prev) => new Set([...prev, nodeId]));
          }
        } else {
          const [driveContents, knowledgeBaseResponse] = await Promise.all([
            googleDriveFolders.loadFolderContents(
              nodeId,
              node.file.resource_id
            ),
            onKnowledgeBaseFilesLoad
              ? (knowledgeBaseFolders
                  .getFolderContents(nodeId)
                  ?.filter((file) =>
                    file.inode_path.path.startsWith(node.file.inode_path.path)
                  ) as FileSystemNode[])
              : Promise.resolve([]),
          ]);

          if (driveContents.length > 0) {
            setOpenFolders((prev) => new Set([...prev, nodeId]));
          }

          if (
            knowledgeBaseId &&
            onKnowledgeBaseFilesLoad &&
            Array.isArray(knowledgeBaseResponse)
          ) {
            const newKnowledgeBaseFileIds = new Set(
              knowledgeBaseResponse.map((file) => file.inode_path.path)
            );
            onKnowledgeBaseFilesLoad(
              node.file.inode_path.path,
              newKnowledgeBaseFileIds
            );
          }
        }
      } catch (error) {
        console.error("Error loading folder contents:", error);
        setOpenFolders((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      }
    },
    [
      getNodeId,
      isKnowledgeBase,
      knowledgeBaseFolders,
      googleDriveFolders,
      knowledgeBaseId,
      onKnowledgeBaseFilesLoad,
    ]
  );

  const toggleFolder = useCallback(
    (node: FileTreeNode) => {
      const nodeId = getNodeId(node);
      const isOpen = openFolders.has(nodeId);

      const newOpenFolders = new Set(openFolders);
      if (isOpen) {
        newOpenFolders.delete(nodeId);
      } else {
        newOpenFolders.add(nodeId);
        handleFolderOpen(node);
      }
      setOpenFolders(newOpenFolders);
    },
    [openFolders, getNodeId, handleFolderOpen]
  );

  const isNodeLoading = useCallback(
    (nodeId: string) => {
      return isKnowledgeBase
        ? knowledgeBaseFolders.isLoading(nodeId)
        : googleDriveFolders.isLoading(nodeId);
    },
    [isKnowledgeBase, knowledgeBaseFolders, googleDriveFolders]
  );

  return {
    openFolders,
    getNodeId,
    getFolderContentsForNode,
    createFileNode,
    getAllChildResourceIds,
    handleFolderOpen,
    toggleFolder,
    isNodeLoading,
  };
}
