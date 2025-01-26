"use client";

import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  FileListHandle,
  FileListProps,
  FileNode,
} from "@/app/types/google-drive-ui";
import { FileToolbar } from "./FileToolbar";
import { FileTree } from "./FileTree";
import { buildFileTree, getAllPaths } from "@/app/utils/file-tree";
import { SearchX } from "lucide-react";
import { GoogleDriveFile } from "@/app/types/google-drive";

interface ExtendedFileListProps extends FileListProps {
  processingFiles?: Set<string>;
  onFileDeleted?: (resourceId: string) => void;
}

export const FileList = forwardRef<FileListHandle, ExtendedFileListProps>(
  ({ files, selectedFiles, onSelect, processingFiles, onFileDeleted }, ref) => {
    const [search, setSearch] = useState<string>("");
    const [sort, setSort] = useState<"asc" | "desc">("desc");
    const [folderContents, setFolderContents] = useState<
      Record<string, GoogleDriveFile[]>
    >({});

    const findNodeByPath = useCallback(
      (fileTree: Record<string, FileNode>, path: string): FileNode | null => {
        const parts = path.split("/").filter(Boolean);
        let current = fileTree;
        let currentPath = "";

        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (
            current[part] &&
            current[part].file.inode_path.path === currentPath
          ) {
            if (currentPath === path) {
              return current[part];
            }
            current = current[part].children;
          } else {
            return null;
          }
        }

        return null;
      },
      []
    );

    const searchInTree = useCallback(
      (node: FileNode): GoogleDriveFile[] => {
        const results: GoogleDriveFile[] = [];
        const searchTerm = search.toLowerCase().trim();

        // Check if current node matches
        const currentPath = node.file.inode_path.path.toLowerCase();
        const isMatch = currentPath.includes(searchTerm);

        // Add current node if it matches
        if (isMatch) {
          results.push(node.file);
        }

        // Always search in children to find more specific matches
        if (node.file.inode_type === "directory") {
          // Search in static tree
          Object.values(node.children).forEach((child) => {
            results.push(...searchInTree(child));
          });

          // Search in dynamically loaded contents
          const contents = folderContents[node.file.resource_id];
          if (contents) {
            contents.forEach((file) => {
              const filePath = file.inode_path.path.toLowerCase();
              if (filePath.includes(searchTerm)) {
                results.push(file);
              }
              if (
                file.inode_type === "directory" &&
                folderContents[file.resource_id]
              ) {
                const childNode = { file, children: {} };
                results.push(...searchInTree(childNode));
              }
            });
          }
        }

        return results;
      },
      [folderContents, search]
    );

    const handleFolderLoad = useCallback(
      (resourceId: string, contents: GoogleDriveFile[]) => {
        setFolderContents((prev) => ({
          ...prev,
          [resourceId]: contents,
        }));
      },
      []
    );

    const filteredFiles = useMemo(() => {
      if (!search.trim()) return files;

      const fileTree = buildFileTree(files);
      const searchTerm = search.toLowerCase().trim();

      // Get all matching files from the tree structure
      const allMatches: GoogleDriveFile[] = [];
      const matchingPaths = new Set<string>();
      const requiredParentPaths = new Set<string>();
      const autoExpandedFolders = new Set<string>();

      // First pass: collect all matches and identify the deepest ones
      const searchResults = Object.values(fileTree).flatMap((node) =>
        searchInTree(node)
      );

      // Group results by type (file vs directory) and sort by path length
      const fileMatches = searchResults
        .filter((file) => file.inode_type !== "directory")
        .sort((a, b) => b.inode_path.path.length - a.inode_path.path.length);

      const directoryMatches = searchResults
        .filter((file) => file.inode_type === "directory")
        .sort((a, b) => b.inode_path.path.length - a.inode_path.path.length);

      // Process file matches first
      const processMatch = (file: GoogleDriveFile) => {
        const path = file.inode_path.path.toLowerCase();
        if (path.includes(searchTerm)) {
          // Add this match
          allMatches.push(file);
          matchingPaths.add(file.inode_path.path);

          // Add parent paths to required set (for maintaining hierarchy)
          let parentPath = file.inode_path.path;
          while (parentPath.includes("/")) {
            parentPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
            if (parentPath) {
              requiredParentPaths.add(parentPath);
              // If this is a directory that matches, auto-expand it
              if (file.inode_type === "directory") {
                autoExpandedFolders.add(file.resource_id);
              }
            }
          }
        }
      };

      // Process files first, then directories only if no file matches
      if (fileMatches.length > 0) {
        fileMatches.forEach(processMatch);
      } else {
        directoryMatches.forEach(processMatch);
      }

      // Second pass: build a tree that includes matches and their required structure
      const filteredResult = files.filter((file) => {
        const path = file.inode_path.path;

        // Include if:
        // 1. It's a direct match
        const isMatch = matchingPaths.has(path);

        // 2. It's a required parent for the hierarchy
        const isRequiredParent = requiredParentPaths.has(path);

        // 3. It's a child of a matching directory AND contains the search term
        const isRelevantChild = Array.from(matchingPaths).some((matchPath) => {
          const isChild = path.startsWith(matchPath + "/");
          const containsSearch = path.toLowerCase().includes(searchTerm);
          return isChild && containsSearch;
        });

        // 4. It's a loaded child of a matching directory
        const isChildOfMatchingDir = Array.from(matchingPaths).some(
          (matchPath) => {
            const parentDir = path.substring(0, path.lastIndexOf("/"));
            return parentDir === matchPath;
          }
        );

        return (
          isMatch || isRequiredParent || isRelevantChild || isChildOfMatchingDir
        );
      });

      // Auto-expand matching folders
      if (filteredResult.length > 0) {
        autoExpandedFolders.forEach((resourceId) => {
          if (!folderContents[resourceId]) {
            const matchingFile = filteredResult.find(
              (f) => f.resource_id === resourceId
            );
            if (matchingFile) {
              // Simulate folder load to expand it
              handleFolderLoad(matchingFile.resource_id, []);
            }
          }
        });
      }

      return filteredResult;
    }, [files, search, searchInTree, folderContents, handleFolderLoad]);

    useImperativeHandle(
      ref,
      () => ({
        selectAll: (checked: boolean) => {
          const fileTree = buildFileTree(files);
          if (checked) {
            // Get all visible paths from filtered files
            const allPaths = getAllPaths(filteredFiles);

            // Create a set to track all paths to select
            const pathsToSelect = new Set<string>();

            // Process each path and its children if it's a directory
            allPaths.forEach((path) => {
              const node = findNodeByPath(fileTree, path);
              if (node) {
                // Add the current path
                pathsToSelect.add(path);

                // If it's a directory with loaded contents, add all children
                if (
                  node.file.inode_type === "directory" &&
                  folderContents[node.file.resource_id]
                ) {
                  const contents = folderContents[node.file.resource_id];
                  contents?.forEach((child) => {
                    pathsToSelect.add(child.inode_path.path);
                  });
                }
              }
            });

            // Select all paths
            pathsToSelect.forEach((path) => {
              const node = findNodeByPath(fileTree, path);
              if (node) {
                onSelect(node, path, true);
              }
            });
          } else {
            // Deselect all files
            selectedFiles.forEach((path) => {
              const node = findNodeByPath(fileTree, path);
              if (node) {
                onSelect(node, path, false);
              }
            });
          }
        },
      }),
      [
        files,
        filteredFiles,
        onSelect,
        selectedFiles,
        findNodeByPath,
        folderContents,
      ]
    );

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (selectedFiles.size > 0) {
          const fileTree = buildFileTree(files);
          selectedFiles.forEach((path) => {
            const node = findNodeByPath(fileTree, path);
            if (node) {
              onSelect(node, path, false);
            }
          });
        }
        setSearch(value);
      },
      [selectedFiles, files, findNodeByPath, onSelect]
    );

    return (
      <div className="flex flex-col gap-4">
        <FileToolbar
          sort={sort}
          onSortChange={setSort}
          search={search}
          onSearchChange={handleSearchChange}
        />
        {filteredFiles.length > 0 ? (
          <FileTree
            files={filteredFiles}
            selectedFiles={selectedFiles}
            onSelect={onSelect}
            folderContents={folderContents}
            onFolderLoad={handleFolderLoad}
            processingFiles={processingFiles}
            onFileDeleted={onFileDeleted}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-muted-foreground">
            <SearchX className="h-12 w-12" />
            <div className="text-center">
              <p className="text-sm font-medium">No files found</p>
              <p className="text-sm">
                No files match your search &ldquo;{search.trim()}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

FileList.displayName = "FileList";
