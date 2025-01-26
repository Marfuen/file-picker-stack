export interface GoogleDriveFile {
  resource_id: string;
  inode_id: string;
  indexed_at: string | null;
  inode_path: {
    path: string;
  };
  inode_type: "file" | "directory";
  mime_type?: string;
  size?: number;
  modified_time?: string;
}

export interface GoogleDriveFilesResponse {
  data: GoogleDriveFile[];
}
