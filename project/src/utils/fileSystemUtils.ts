import { FileNode } from '../types/FileSystem';

export const getFileIcon = (node: FileNode): string => {
  if (node.type === 'directory') {
    return node.isExpanded ? '📂' : '📁';
  }
  
  switch (node.extension) {
    case 'md': return '📝';
    case 'tsx':
    case 'jsx':
    case 'ts':
    case 'js': return '⚛️';
    case 'html': return '🌐';
    case 'css': return '🎨';
    case 'pdf': return '📄';
    case 'xlsx':
    case 'xls': return '📊';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return '🖼️';
    case 'mp4':
    case 'avi':
    case 'mov': return '🎬';
    case 'json': return '⚙️';
    case 'log': return '📋';
    default: return '📄';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileColor = (node: FileNode): string => {
  if (node.type === 'directory') {
    return '#3b82f6'; // Blue for directories
  }
  
  switch (node.extension) {
    case 'md': return '#10b981'; // Green for markdown
    case 'tsx':
    case 'jsx':
    case 'ts':
    case 'js': return '#f59e0b'; // Yellow for code
    case 'html': return '#ef4444'; // Red for HTML
    case 'css': return '#8b5cf6'; // Purple for CSS
    case 'pdf': return '#dc2626'; // Dark red for PDF
    case 'xlsx':
    case 'xls': return '#059669'; // Green for spreadsheets
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return '#ec4899'; // Pink for images
    case 'mp4':
    case 'avi':
    case 'mov': return '#7c3aed'; // Purple for videos
    case 'json': return '#6b7280'; // Gray for config
    case 'log': return '#374151'; // Dark gray for logs
    default: return '#9ca3af'; // Light gray for unknown
  }
};

export const flattenFileTree = (node: FileNode, depth: number = 0): Array<FileNode & { depth: number }> => {
  const result: Array<FileNode & { depth: number }> = [];
  
  result.push({ ...node, depth });
  
  if (node.type === 'directory' && node.isExpanded && node.children) {
    for (const child of node.children) {
      result.push(...flattenFileTree(child, depth + 1));
    }
  }
  
  return result;
};

export const findNodeById = (root: FileNode, id: string): FileNode | null => {
  if (root.id === id) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  
  return null;
};

export const toggleNodeExpansion = (root: FileNode, nodeId: string): FileNode => {
  if (root.id === nodeId && root.type === 'directory') {
    return { ...root, isExpanded: !root.isExpanded };
  }
  
  if (root.children) {
    return {
      ...root,
      children: root.children.map(child => toggleNodeExpansion(child, nodeId))
    };
  }
  
  return root;
};