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
import { Loader2 } from "lucide-react";
import { GoogleDriveFile } from "@/app/types/google-drive";
import { useKnowledgeBase } from "@/app/hooks/useKnowledgeBase";

interface ExtendedFileTreeProps extends FileTreeProps {
  knowledgeBaseFileIds?: Set<string>;
  onKnowledgeBaseFilesLoad?: (path: string, fileIds: Set<string>) => void;
}

export function FileTree({
  files,
  selectedFiles,
  onSelect,
  folderContents = {},
  onFolderLoad,
  knowledgeBaseFileIds,
  onKnowledgeBaseFilesLoad,
}: ExtendedFileTreeProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const { getStoredKnowledgeBaseId, listFiles } = useKnowledgeBase();
  const knowledgeBaseId = getStoredKnowledgeBaseId();

  const handleFolderOpen = useCallback(
    async (node: FileNode) => {
      // If we already have the contents, don't fetch again
      if (folderContents[node.file.resource_id]) {
        return;
      }

      // Start loading
      setLoadingFolders((prev) => new Set([...prev, node.file.resource_id]));

      try {
        const [driveResponse, knowledgeBaseResponse] = await Promise.all([
          fetch(
            `/api/google-drive/files?resourceId=${node.file.resource_id}`
          ).then((res) => {
            if (!res.ok) throw new Error("Failed to fetch folder contents");
            return res.json();
          }),
          knowledgeBaseId
            ? listFiles(node.file.inode_path.path)
            : Promise.resolve<GoogleDriveFile[]>([]),
        ]);

        // Update the parent component's state
        onFolderLoad?.(node.file.resource_id, driveResponse);

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
      } catch (error) {
        console.error(
          "Error loading folder contents:",
          JSON.stringify(error, null, 2)
        );
        // On error, remove from open folders to allow retry
        setOpenFolders((prev) => {
          const next = new Set(prev);
          next.delete(node.file.resource_id);
          return next;
        });
      } finally {
        setLoadingFolders((prev) => {
          const next = new Set(prev);
          next.delete(node.file.resource_id);
          return next;
        });
      }
    },
    [
      folderContents,
      onFolderLoad,
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
          resourceIds.push(childNode.file.resource_id);
          resourceIds.push(...getAllChildResourceIds(childNode));
        });

        // Add resource IDs from dynamically loaded contents
        const contents = folderContents[node.file.resource_id];
        if (contents) {
          contents.forEach((file) => {
            resourceIds.push(file.resource_id);

            // If this is a directory from the loaded contents, we need to add its children too
            if (file.inode_type === "directory") {
              const childNode = createFileNode(file);
              resourceIds.push(...getAllChildResourceIds(childNode));
            }
          });
        }
      }

      return resourceIds;
    },
    [folderContents, createFileNode]
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
    const isSelected = selectedFiles.has(node.file.resource_id);
    const isLoading = loadingFolders.has(node.file.resource_id);
    const directoryContents = folderContents[node.file.resource_id];
    const hasChildren =
      isDirectory &&
      (Object.keys(node.children).length > 0 ||
        (directoryContents && directoryContents.length > 0));

    // Check if this node or any of its parent folders are in the knowledge base
    const nodePath = node.file.inode_path.path;
    const isInKnowledgeBase = knowledgeBaseFileIds?.has(nodePath);

    if (isDirectory) {
      const isOpen = openFolders.has(node.file.resource_id);

      return (
        <AccordionItem
          value={node.file.resource_id}
          key={node.file.resource_id}
          className="border-none"
        >
          <AccordionTrigger
            className={cn(
              "hover:no-underline py-0 [&>svg]:hidden group w-full",
              isSelected && "bg-muted"
            )}
            onClick={(e) => {
              // Prevent the accordion from handling the click
              e.preventDefault();

              // Toggle the folder open state
              const newOpenFolders = new Set(openFolders);
              if (isOpen) {
                newOpenFolders.delete(node.file.resource_id);
              } else {
                newOpenFolders.add(node.file.resource_id);
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
                isInKnowledgeBase={isInKnowledgeBase}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            {isLoading ? (
              <div
                className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground"
                style={{ marginLeft: (depth + 1) * 32 + "px" }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching files...
              </div>
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
      <div key={node.file.resource_id}>
        <FileView
          node={node}
          isSelected={isSelected}
          depth={depth}
          onSelect={handleSelect}
          isInKnowledgeBase={isInKnowledgeBase}
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
