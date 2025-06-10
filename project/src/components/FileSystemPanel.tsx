import React from 'react';
import { FileNode, FileSystemState } from '../types/FileSystem';
import { getFileIcon, formatFileSize, flattenFileTree } from '../utils/fileSystemUtils';
import { ChevronRight, ChevronDown, Search, Folder, File } from 'lucide-react';

interface FileSystemPanelProps {
  fileSystem: FileNode;
  state: FileSystemState;
  onNodeClick: (nodeId: string) => void;
  onNodeExpand: (nodeId: string) => void;
  onSearchChange: (query: string) => void;
}

export const FileSystemPanel: React.FC<FileSystemPanelProps> = ({
  fileSystem,
  state,
  onNodeClick,
  onNodeExpand,
  onSearchChange
}) => {
  const flatNodes = flattenFileTree(fileSystem);
  const filteredNodes = state.searchQuery 
    ? flatNodes.filter(node => 
        node.name.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    : flatNodes;

  return (
    <div className="w-80 bg-gray-900/95 border-r border-gray-700/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-lg font-bold text-white mb-3">File System</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files..."
            value={state.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
              state.selectedNode === node.id 
                ? 'bg-blue-600/30 border border-blue-500/50' 
                : 'hover:bg-gray-700/50'
            }`}
            style={{ paddingLeft: `${8 + node.depth * 16}px` }}
            onClick={() => onNodeClick(node.id)}
          >
            {/* Expand/Collapse Icon */}
            {node.type === 'directory' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeExpand(node.id);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {node.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            
            {/* File/Folder Icon */}
            <span className="text-lg">{getFileIcon(node)}</span>
            
            {/* Name and Details */}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {node.name}
              </div>
              {node.type === 'file' && node.size && (
                <div className="text-gray-400 text-xs">
                  {formatFileSize(node.size)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-gray-700/50 bg-gray-800/50">
        <div className="text-xs text-gray-400">
          Current: {state.currentPath}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {filteredNodes.length} items
        </div>
      </div>
    </div>
  );
};