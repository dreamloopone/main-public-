import { useState, useCallback } from 'react';

// Use the actual File System Access API types
declare global {
  interface Window {
    showDirectoryPicker: (options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

export interface RealFileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  path: string;
  lastModified: Date;
  children?: RealFileNode[];
}

export const useFileSystemAPI = () => {
  const [isSupported, setIsSupported] = useState(
    'showDirectoryPicker' in window
  );
  const [currentDirectory, setCurrentDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestDirectoryAccess = useCallback(async () => {
    try {
      if (!isSupported) {
        throw new Error('File System Access API not supported in this browser');
      }

      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      setCurrentDirectory(dirHandle);
      setError(null);
      return dirHandle;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('User cancelled directory selection');
      } else {
        setError(`Failed to access directory: ${err.message}`);
      }
      return null;
    }
  }, [isSupported]);

  const readDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle, 
    basePath: string = '',
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<RealFileNode[]> => {
    const nodes: RealFileNode[] = [];
    
    if (currentDepth >= maxDepth) return nodes;

    try {
      for await (const [name, handle] of dirHandle.values()) {
        const path = basePath ? `${basePath}/${name}` : name;
        const id = `${path}_${Date.now()}_${Math.random()}`;
        
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          const extension = name.split('.').pop()?.toLowerCase();
          
          nodes.push({
            id,
            name,
            type: 'file',
            size: file.size,
            extension,
            handle,
            path,
            lastModified: new Date(file.lastModified)
          });
        } else if (handle.kind === 'directory') {
          // Read subdirectory
          const children = await readDirectory(handle, path, maxDepth, currentDepth + 1);
          
          nodes.push({
            id,
            name,
            type: 'directory',
            handle,
            path,
            lastModified: new Date(), // Directories don't have lastModified
            children
          });
        }
        
        // Limit total files for performance
        if (nodes.length > 500) {
          console.warn('Limiting file count to 500 for performance');
          break;
        }
      }
    } catch (err: any) {
      console.error('Error reading directory:', err);
      setError(`Failed to read directory: ${err.message}`);
    }

    return nodes;
  }, []);

  const copyFile = useCallback(async (
    sourceHandle: FileSystemFileHandle,
    targetDirHandle: FileSystemDirectoryHandle,
    newName?: string
  ) => {
    try {

      const file = await sourceHandle.getFile();
      const fileName = newName || sourceHandle.name;
      
      const newFileHandle = await targetDirHandle.getFileHandle(fileName, { create: true });
      const writable = await newFileHandle.createWritable();
      
      await writable.write(file);
      await writable.close();
      
      console.log(`File copied: ${sourceHandle.name} -> ${fileName}`);
      return true;
    } catch (err: any) {
      setError(`Failed to copy file: ${err.message}`);
      console.error('Copy error:', err);
      return false;
    }
  }, []);

  const moveFile = useCallback(async (
    sourceHandle: FileSystemFileHandle,
    sourceDirHandle: FileSystemDirectoryHandle,
    targetDirHandle: FileSystemDirectoryHandle,
    newName?: string
  ) => {
    try {
      // Copy file to new location
      const copySuccess = await copyFile(sourceHandle, targetDirHandle, newName);
      
      if (copySuccess) {
        // Remove from original location
        await sourceDirHandle.removeEntry(sourceHandle.name);
        console.log(`File moved: ${sourceHandle.name}`);
        return true;
      }
      
      return false;
    } catch (err: any) {
      setError(`Failed to move file: ${err.message}`);
      console.error('Move error:', err);
      return false;
    }
  }, [copyFile]);

  const deleteFile = useCallback(async (
    fileHandle: FileSystemFileHandle | FileSystemDirectoryHandle,
    parentDirHandle: FileSystemDirectoryHandle
  ) => {
    try {
      await parentDirHandle.removeEntry(fileHandle.name, { recursive: true });
      console.log(`File deleted: ${fileHandle.name}`);
      return true;
    } catch (err: any) {
      setError(`Failed to delete file: ${err.message}`);
      console.error('Delete error:', err);
      return false;
    }
  }, []);

  const createDirectory = useCallback(async (
    parentDirHandle: FileSystemDirectoryHandle,
    dirName: string
  ) => {
    try {
      const newDirHandle = await parentDirHandle.getDirectoryHandle(dirName, { create: true });
      console.log(`Directory created: ${dirName}`);
      return newDirHandle;
    } catch (err: any) {
      setError(`Failed to create directory: ${err.message}`);
      console.error('Create directory error:', err);
      return null;
    }
  }, []);
  return {
    isSupported,
    currentDirectory,
    error,
    requestDirectoryAccess,
    readDirectory,
    copyFile,
    moveFile,
    deleteFile,
    createDirectory,
    clearError: () => setError(null)
  };
};