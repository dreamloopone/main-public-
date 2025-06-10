import { RealFileNode } from '../hooks/useFileSystemAPI';

export const convertRealFilesToFileNodes = (realFiles: RealFileNode[], parentPath: string = ''): any => {
  // Convert RealFileNode structure to our existing FileNode structure
  const convertNode = (node: RealFileNode, depth: number = 0): any => {
    const converted = {
      id: node.id,
      name: node.name,
      type: node.type,
      size: node.size,
      extension: node.extension,
      path: node.path,
      lastModified: node.lastModified,
      isExpanded: depth < 2, // Auto-expand first 2 levels
      realHandle: node.handle, // Keep reference to real file handle
      children: node.children ? node.children.map(child => convertNode(child, depth + 1)) : undefined
    };
    
    return converted;
  };

  // Create a root node that contains all the real files
  const rootNode = {
    id: 'real-root',
    name: 'File System',
    type: 'directory' as const,
    path: parentPath || '/',
    lastModified: new Date(),
    isExpanded: true,
    children: realFiles.map(file => convertNode(file))
  };

  return rootNode;
};

export const findRealFileHandle = (node: any): FileSystemFileHandle | FileSystemDirectoryHandle | null => {
  return node.realHandle || null;
};

export const findParentDirectoryHandle = (fileSystem: any, targetNodeId: string): FileSystemDirectoryHandle | null => {
  const findParent = (node: any, targetId: string): any => {
    if (node.children) {
      for (const child of node.children) {
        if (child.id === targetId) {
          return node; // Found the parent
        }
        const found = findParent(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const parentNode = findParent(fileSystem, targetNodeId);
  return parentNode ? findRealFileHandle(parentNode) as FileSystemDirectoryHandle : null;
};

export const performRealFileOperation = async (
  operation: 'copy' | 'move' | 'delete',
  sourceNodeId: string,
  targetNodeId: string | null,
  fileSystem: any,
  fileSystemAPI: any
) => {
  try {
    const sourceNode = findNodeById(fileSystem, sourceNodeId);
    if (!sourceNode) {
      throw new Error('Source file not found');
    }

    const sourceHandle = findRealFileHandle(sourceNode);
    if (!sourceHandle) {
      throw new Error('Source file handle not found');
    }

    const sourceParentHandle = findParentDirectoryHandle(fileSystem, sourceNodeId);
    if (!sourceParentHandle) {
      throw new Error('Source parent directory not found');
    }

    switch (operation) {
      case 'delete':
        return await fileSystemAPI.deleteFile(sourceHandle, sourceParentHandle);

      case 'copy':
      case 'move':
        if (!targetNodeId) {
          throw new Error('Target directory required for copy/move operations');
        }

        const targetNode = findNodeById(fileSystem, targetNodeId);
        if (!targetNode || targetNode.type !== 'directory') {
          throw new Error('Target must be a directory');
        }

        const targetHandle = findRealFileHandle(targetNode) as FileSystemDirectoryHandle;
        if (!targetHandle) {
          throw new Error('Target directory handle not found');
        }

        if (operation === 'copy') {
          return await fileSystemAPI.copyFile(sourceHandle as FileSystemFileHandle, targetHandle);
        } else {
          return await fileSystemAPI.moveFile(
            sourceHandle as FileSystemFileHandle, 
            sourceParentHandle, 
            targetHandle
          );
        }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error(`File operation failed:`, error);
    return false;
  }
};

// Helper function to find node by ID (reuse existing utility)
const findNodeById = (root: any, id: string): any | null => {
  if (root.id === id) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  
  return null;
};