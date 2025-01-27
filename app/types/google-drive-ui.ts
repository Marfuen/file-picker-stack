import { FileSystemNode, FileTreeNode } from "./file-system";

export interface FileListProps {
  onSelectionChange: (count: number) => void;
  files: FileSystemNode[];
  selectedFiles: Set<string>;
  onSelect: (
    node: FileTreeNode,
    resourceId: string,
    checked: boolean,
    childResourceIds?: string[]
  ) => void;
}

export interface FileListHandle {
  selectAll: (checked: boolean) => void;
}

export interface FileToolbarProps {
  sort: "asc" | "desc";
  onSortChange: (sort: "asc" | "desc") => void;
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
