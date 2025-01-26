import { GoogleDriveFile } from "./google-drive";

export interface FileNode {
  file: GoogleDriveFile;
  children: { [key: string]: FileNode };
}

export interface FileListProps {
  onSelectionChange: (count: number) => void;
  files: GoogleDriveFile[];
  selectedFiles: Set<string>;
  onSelect: (
    node: FileNode,
    resourceId: string,
    checked: boolean,
    childResourceIds?: string[]
  ) => void;
}

export interface FileListHandle {
  selectAll: (checked: boolean) => void;
}

export interface FileViewProps {
  node: FileNode;
  isSelected: boolean;
  depth?: number;
  onSelect: (
    node: FileNode,
    resourceId: string,
    checked: boolean,
    childResourceIds?: string[]
  ) => void;
}

export interface FileTreeProps {
  files: GoogleDriveFile[];
  selectedFiles: Set<string>;
  onSelect: (
    node: FileNode,
    resourceId: string,
    checked: boolean,
    childResourceIds?: string[]
  ) => void;
  folderContents?: Record<string, GoogleDriveFile[]>;
  onFolderLoad?: (resourceId: string, contents: GoogleDriveFile[]) => void;
}

export interface FileToolbarProps {
  sort: "asc" | "desc";
  onSortChange: (sort: "asc" | "desc") => void;
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
