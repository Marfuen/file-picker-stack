/**
 * Base interface for any file or directory in the system
 */
export interface BaseNode {
  resource_id: string;
  inode_path: { path: string };
  inode_type: "file" | "directory";
  inode_id: string;
  size?: number;
}

/**
 * Interface for Google Drive specific node properties
 */
export interface GoogleDriveNode extends BaseNode {
  indexed_at: string | null;
}

/**
 * Interface for Knowledge Base specific node properties
 */
export interface KnowledgeBaseNode extends BaseNode {
  indexed_at?: never;
}

/**
 * Union type for all possible node types
 */
export type FileSystemNode = GoogleDriveNode | KnowledgeBaseNode;

/**
 * Interface for a node in the file tree
 */
export interface FileTreeNode {
  file: FileSystemNode;
  children: Record<string, FileTreeNode>;
}

/**
 * Common props for file selection handling
 */
export interface FileSelectionProps {
  onSelect: (
    node: FileTreeNode,
    resourceId: string,
    checked: boolean,
    childResourceIds?: string[]
  ) => void;
  selectedFiles?: Set<string>;
}

/**
 * Common props for file tree components
 */
export interface BaseFileTreeProps extends FileSelectionProps {
  files: FileSystemNode[];
  isKnowledgeBase?: boolean;
  processingFiles?: Set<string>;
  onFileDeleted?: (resourceId: string, path: string) => void;
}

/**
 * Props for file view components
 */
export interface FileViewProps extends FileSelectionProps {
  node: FileTreeNode;
  depth?: number;
  isSelected: boolean;
  processingFiles?: Set<string>;
  onFileDeleted?: (resourceId: string, path: string) => void;
  isKnowledgeBase?: boolean;
  triggerLoad?: () => void;
}

/**
 * Props for file list components
 */
export interface FileListProps extends BaseFileTreeProps {
  onSelectionChange: (count: number) => void;
}

/**
 * Props for file toolbar components
 */
export interface FileToolbarProps {
  sort: "asc" | "desc";
  onSortChange: (sort: "asc" | "desc") => void;
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
