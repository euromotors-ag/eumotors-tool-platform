// File System Access API type declarations
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: "read" | "readwrite";
    }): Promise<FileSystemDirectoryHandle>;
  }
}

export interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemFileHandle>;
  values(): AsyncIterableIterator<FileSystemHandle>;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  createWritable(): Promise<FileSystemWritableFileStream>;
  getFile(): Promise<File>;
}

export interface FileSystemWritableFileStream {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

export type DirectoryHandle = FileSystemDirectoryHandle;
export type FileHandle = FileSystemFileHandle;
export type WritableStream = FileSystemWritableFileStream;
