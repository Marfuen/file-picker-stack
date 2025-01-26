import { FileNode } from "../types/google-drive-ui";
import { GoogleDriveFile } from "../types/google-drive";

/**
 * Builds a tree structure from an array of Google Drive files.
 * Each node in the tree represents either a file or directory.
 *
 * @param files - Array of GoogleDriveFile objects to build the tree from
 * @returns An object representing the root of the file tree, where keys are file/folder names
 *          and values are FileNode objects containing the file data and any children
 */
export function buildFileTree(files: GoogleDriveFile[]): {
  [key: string]: FileNode;
} {
  const root: { [key: string]: FileNode } = {};

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
          file: isLastPart
            ? file
            : {
                resource_id: `dir_${currentPath}`,
                inode_path: { path: currentPath },
                inode_type: "directory",
                inode_id: "",
              },
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
 * @param files - Array of GoogleDriveFile objects to extract paths from
 * @returns A Set containing all unique file and directory paths
 */
export function getAllPaths(files: GoogleDriveFile[]): Set<string> {
  const paths = new Set<string>();

  function traverse(file: GoogleDriveFile) {
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
 * @param nodes - Array of tuples containing the node name and FileNode object
 * @returns Sorted array of [string, FileNode] tuples
 */
export function sortFileNodes(
  nodes: [string, FileNode][]
): [string, FileNode][] {
  return nodes.sort(([, a], [, b]) => {
    if (a.file.inode_type === b.file.inode_type) {
      return a.file.inode_path.path.localeCompare(b.file.inode_path.path);
    }
    return a.file.inode_type === "directory" ? -1 : 1;
  });
}

export function getAllResourceIds(files: GoogleDriveFile[]): Set<string> {
  const resourceIds = new Set<string>();

  function traverse(file: GoogleDriveFile) {
    resourceIds.add(file.resource_id);
  }

  files.forEach(traverse);
  return resourceIds;
}
