import {
  FileSystemNode,
  FileTreeNode,
  KnowledgeBaseNode,
} from "../types/file-system";

/**
 * Creates a directory node with the given path
 */
function createDirectoryNode(path: string): KnowledgeBaseNode {
  return {
    resource_id: `dir_${path}`,
    inode_path: { path },
    inode_type: "directory",
    inode_id: "",
    size: 0,
  };
}

/**
 * Builds a tree structure from an array of files.
 * Each node in the tree represents either a file or directory.
 *
 * @param files - Array of file objects to build the tree from
 * @returns An object representing the root of the file tree, where keys are file/folder names
 *          and values are FileTreeNode objects containing the file data and any children
 */
export function buildFileTree(files: FileSystemNode[]): {
  [key: string]: FileTreeNode;
} {
  const root: { [key: string]: FileTreeNode } = {};

  files.forEach((file) => {
    const pathParts = file.inode_path.path.split("/").filter(Boolean);
    let currentLevel = root;

    // For each part of the path, create or traverse the tree
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;
      const currentPath = pathParts.slice(0, i + 1).join("/");

      if (!currentLevel[part]) {
        currentLevel[part] = {
          file: isLastPart ? file : createDirectoryNode(currentPath),
          children: {},
        };
      }

      if (!isLastPart) {
        currentLevel = currentLevel[part].children;
      }
    }
  });

  return root;
}

/**
 * Gets all file and directory paths from a file tree.
 * Recursively traverses the tree to collect all paths.
 *
 * @param files - Array of file objects to extract paths from
 * @returns A Set containing all unique file and directory paths
 */
export function getAllPaths(files: FileSystemNode[]): Set<string> {
  const paths = new Set<string>();

  function traverse(file: FileSystemNode) {
    paths.add(file.inode_path.path);
  }

  files.forEach(traverse);
  return paths;
}

/**
 * Formats a file size in bytes to a human-readable string.
 * Converts to the most appropriate unit (B, KB, MB, GB, TB).
 *
 * @param bytes - The file size in bytes
 * @returns A formatted string with the size and unit (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Sorts an array of file nodes by type (directories first) and then by path.
 *
 * @param nodes - Array of tuples containing the node name and FileTreeNode object
 * @returns Sorted array of [string, FileTreeNode] tuples
 */
export function sortFileNodes(
  nodes: [string, FileTreeNode][]
): [string, FileTreeNode][] {
  return nodes.sort(([, a], [, b]) => {
    if (a.file.inode_type === b.file.inode_type) {
      return a.file.inode_path.path.localeCompare(b.file.inode_path.path);
    }
    return a.file.inode_type === "directory" ? -1 : 1;
  });
}

/**
 * Gets all resource IDs from a file tree.
 * Recursively traverses the tree to collect all IDs.
 *
 * @param files - Array of file objects to extract IDs from
 * @returns A Set containing all unique resource IDs
 */
export function getAllResourceIds(files: FileSystemNode[]): Set<string> {
  const resourceIds = new Set<string>();

  function traverse(file: FileSystemNode) {
    resourceIds.add(file.resource_id);
  }

  files.forEach(traverse);
  return resourceIds;
}
