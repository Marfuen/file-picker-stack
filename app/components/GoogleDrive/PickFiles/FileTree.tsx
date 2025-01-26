"use client";

import { FileNode, FileTreeProps } from "@/app/types/google-drive-ui";
import { buildFileTree, sortFileNodes } from "@/app/utils/file-tree";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { FileView } from "./FileView";
import { GoogleDriveFile } from "@/app/types/google-drive";
import { useKnowledgeBase } from "@/app/hooks/useKnowledgeBase";
import { Skeleton } from "@/components/ui/skeleton";
import { useKnowledgeBaseFiles } from "@/app/hooks/useKnowledgeBaseFiles";
import { useGoogleDriveFolders } from "@/app/hooks/useGoogleDriveFolders";

interface ExtendedFileTreeProps extends FileTreeProps {
  onKnowledgeBaseFilesLoad?: (path: string, fileIds: Set<string>) => void;
  processingFiles?: Set<string>;
  onFileDeleted?: (resourceId: string) => void;
  isKnowledgeBase?: boolean;
}

export function FileTree({
  files,
  selectedFiles,
  onSelect,
  onKnowledgeBaseFilesLoad,
  processingFiles,
  onFileDeleted,
  isKnowledgeBase = false,
}: ExtendedFileTreeProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const { getStoredKnowledgeBaseId, listFiles } = useKnowledgeBase();
  const knowledgeBaseId = getStoredKnowledgeBaseId();
  const knowledgeBaseFiles = useKnowledgeBaseFiles();
  const googleDriveFolders = useGoogleDriveFolders();

  const getNodeId = useCallback(
    (node: FileNode) => {
      return isKnowledgeBase ? node.file.inode_id : node.file.resource_id;
    },
    [isKnowledgeBase]
  );

  const getFolderContents = useCallback(
    (nodeId: string) => {
      return isKnowledgeBase
        ? knowledgeBaseFiles.getFolderContents(nodeId)
        : googleDriveFolders.getFolderContents(nodeId);
    },
    [isKnowledgeBase, knowledgeBaseFiles, googleDriveFolders]
  );

  const handleFolderOpen = useCallback(
    async (node: FileNode) => {
      const nodeId = getNodeId(node);

      try {
        if (isKnowledgeBase) {
          // First check if we already have contents
          const existingContents = knowledgeBaseFiles.getFolderContents(nodeId);
          if (!existingContents) {
            await knowledgeBaseFiles.loadFolderContents(
              nodeId,
              node.file.inode_path.path
            );
          }
        } else {
          const [, knowledgeBaseResponse] = await Promise.all([
            googleDriveFolders.loadFolderContents(
              nodeId,
              node.file.resource_id
            ),
            knowledgeBaseId
              ? listFiles(node.file.inode_path.path)
              : Promise.resolve<GoogleDriveFile[]>([]),
          ]);

          // Update knowledge base file IDs for this folder
          if (
            knowledgeBaseId &&
            onKnowledgeBaseFilesLoad &&
            Array.isArray(knowledgeBaseResponse)
          ) {
            const newKnowledgeBaseFileIds = new Set(
              knowledgeBaseResponse.map(
                (file: GoogleDriveFile) => file.inode_path.path
              )
            );
            onKnowledgeBaseFilesLoad(
              node.file.inode_path.path,
              newKnowledgeBaseFileIds
            );
          }
        }
      } catch (error) {
        console.error(
          "Error loading folder contents:",
          JSON.stringify(error, null, 2)
        );
        // On error, remove from open folders to allow retry
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
      knowledgeBaseFiles,
      googleDriveFolders,
      knowledgeBaseId,
      listFiles,
      onKnowledgeBaseFilesLoad,
    ]
  );

  const createFileNode = useCallback((file: GoogleDriveFile): FileNode => {
    return {
      file,
      children: {},
    };
  }, []);

  const getAllChildResourceIds = useCallback(
    (node: FileNode): string[] => {
      const resourceIds: string[] = [];

      if (node.file.inode_type === "directory") {
        // Add resource IDs from the initial tree structure
        Object.values(node.children).forEach((childNode) => {
          resourceIds.push(getNodeId(childNode));
          resourceIds.push(...getAllChildResourceIds(childNode));
        });

        // Add resource IDs from dynamically loaded contents
        const contents = getFolderContents(getNodeId(node));
        if (contents) {
          contents.forEach((file) => {
            const childNode = createFileNode(file);
            resourceIds.push(getNodeId(childNode));

            // If this is a directory from the loaded contents, we need to add its children too
            if (file.inode_type === "directory") {
              resourceIds.push(...getAllChildResourceIds(childNode));
            }
          });
        }
      }

      return resourceIds;
    },
    [getFolderContents, createFileNode, getNodeId]
  );

  const handleSelect = useCallback(
    (node: FileNode, resourceId: string, checked: boolean) => {
      const childResourceIds = getAllChildResourceIds(node);
      onSelect(node, resourceId, checked, childResourceIds);
    },
    [getAllChildResourceIds, onSelect]
  );

  const renderFileNode = (node: FileNode, path: string, depth = 0) => {
    const isDirectory = node.file.inode_type === "directory";
    const nodeId = getNodeId(node);
    const isSelected = selectedFiles.has(nodeId);
    const isLoading = isKnowledgeBase
      ? knowledgeBaseFiles.isLoading(nodeId)
      : googleDriveFolders.isLoading(nodeId);
    const directoryContents = getFolderContents(nodeId);
    const hasChildren =
      isDirectory &&
      (Object.keys(node.children).length > 0 ||
        (directoryContents && directoryContents.length > 0));

    if (isDirectory) {
      const isOpen = openFolders.has(nodeId);

      return (
        <AccordionItem value={nodeId} key={nodeId} className="border-none">
          <AccordionTrigger
            className={cn(
              "hover:no-underline py-0 [&>svg]:hidden group w-full cursor-pointer",
              isSelected && "bg-muted"
            )}
            onClick={(e) => {
              // Prevent the accordion from handling the click
              e.preventDefault();

              // Toggle the folder open state
              const newOpenFolders = new Set(openFolders);
              if (isOpen) {
                newOpenFolders.delete(nodeId);
              } else {
                newOpenFolders.add(nodeId);
                // Fetch contents if not already loaded
                handleFolderOpen(node);
              }
              setOpenFolders(newOpenFolders);
            }}
          >
            <div className="flex items-center w-full">
              <FileView
                node={node}
                isSelected={isSelected}
                depth={depth}
                onSelect={handleSelect}
                processingFiles={processingFiles}
                onFileDeleted={onFileDeleted}
                isKnowledgeBase={isKnowledgeBase}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            {isLoading ? (
              <>
                {[1, 1, 1].map((width, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-2 px-4 w-full"
                    style={{ paddingLeft: (depth + 1) * 32 + "px" }}
                  >
                    <Skeleton className="h-4 w-4 shrink-0" />
                    <Skeleton
                      className={`h-4 flex-1`}
                      style={{ maxWidth: `${width * 100}%` }}
                    />
                  </div>
                ))}
              </>
            ) : directoryContents ? (
              sortFileNodes(
                directoryContents.map((file) => {
                  // Use the last part of the path as the name
                  const pathParts = file.inode_path.path.split("/");
                  const name = pathParts[pathParts.length - 1];
                  return [name, createFileNode(file)];
                })
              ).map(([childPath, childNode]) =>
                renderFileNode(childNode, `${path}/${childPath}`, depth + 1)
              )
            ) : (
              hasChildren &&
              sortFileNodes(Object.entries(node.children)).map(
                ([childPath, childNode]) =>
                  renderFileNode(childNode, `${path}/${childPath}`, depth + 1)
              )
            )}
          </AccordionContent>
        </AccordionItem>
      );
    }

    return (
      <div key={nodeId}>
        <FileView
          node={node}
          isSelected={isSelected}
          depth={depth}
          onSelect={handleSelect}
          processingFiles={processingFiles}
          onFileDeleted={onFileDeleted}
          isKnowledgeBase={isKnowledgeBase}
        />
      </div>
    );
  };

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
