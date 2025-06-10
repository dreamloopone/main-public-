export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: FileNode[];
  parent?: string;
  path: string;
  lastModified: Date;
  isExpanded?: boolean;
}

export interface FileSystemState {
  currentPath: string;
  selectedNode: string | null;
  expandedDirectories: Set<string>;
  searchQuery: string;
  viewMode: 'tree' | 'list' | 'grid';
}