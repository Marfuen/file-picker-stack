"use client";

import { FileListProps } from "@/app/types/google-drive-ui";
import { FileTree } from "./FileTree";

interface ExtendedFileListProps extends FileListProps {
  processingFiles?: Set<string>;
  onFileDeleted?: (resourceId: string) => void;
}

export const FileList = ({
  files,
  selectedFiles,
  onSelect,
  processingFiles,
  onFileDeleted,
}: ExtendedFileListProps) => {
  return (
    <div className="flex flex-col gap-4">
      <FileTree
        files={files}
        selectedFiles={selectedFiles}
        onSelect={onSelect}
        processingFiles={processingFiles}
        onFileDeleted={onFileDeleted}
      />
    </div>
  );
};

FileList.displayName = "FileList";
