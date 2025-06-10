import React from 'react';
import { FileNode } from '../types/FileSystem';
import { getFileIcon, formatFileSize } from '../utils/fileSystemUtils';
import { Calendar, HardDrive, FileText, Folder, Copy, Move, Trash2, AlertTriangle } from 'lucide-react';

interface FileDetailsPanelProps {
  selectedNode: FileNode | null;
  isRealFileSystem?: boolean;
  onFileOperation?: (operation: 'copy' | 'move' | 'delete', sourceId: string, targetId?: string) => Promise<boolean>;
}

export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({ 
  selectedNode, 
  isRealFileSystem = false,
  onFileOperation 
}) => {
  const [isOperating, setIsOperating] = React.useState(false);

  const handleFileOperation = async (operation: 'copy' | 'move' | 'delete') => {
    if (!selectedNode || !onFileOperation) return;

    if (operation === 'delete') {
      const confirmed = confirm(`Are you sure you want to delete "${selectedNode.name}"? This action cannot be undone.`);
      if (!confirmed) return;
    }

    setIsOperating(true);
    try {
      const success = await onFileOperation(operation, selectedNode.id);
      if (success) {
        console.log(`${operation} operation completed successfully`);
      } else {
        alert(`Failed to ${operation} file. Check console for details.`);
      }
    } catch (error) {
      console.error(`${operation} operation failed:`, error);
      alert(`Error during ${operation}: ${error}`);
    } finally {
      setIsOperating(false);
    }
  };
  if (!selectedNode) {
    return (
      <div className="w-80 bg-gray-900/95 border-l border-gray-700/50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a file or folder to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-900/95 border-l border-gray-700/50 p-4">
      <div className="space-y-6">
        {/* File Icon and Name */}
        <div className="text-center">
          <div className="text-6xl mb-3">{getFileIcon(selectedNode)}</div>
          <h3 className="text-lg font-bold text-white break-words">
            {selectedNode.name}
          </h3>
          <p className="text-sm text-gray-400 capitalize">
            {selectedNode.type}
          </p>
        </div>

        {/* File Properties */}
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Properties
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white capitalize">{selectedNode.type}</span>
              </div>
              
              {selectedNode.extension && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Extension:</span>
                  <span className="text-white">.{selectedNode.extension}</span>
                </div>
              )}
              
              {selectedNode.size && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white">{formatFileSize(selectedNode.size)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-400">Modified:</span>
                <span className="text-white text-xs">
                  {selectedNode.lastModified.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Path Information */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
              <Folder className="w-4 h-4" />
              Location
            </h4>
            <p className="text-xs text-gray-400 break-all font-mono">
              {selectedNode.path}
            </p>
          </div>

          {/* Directory Contents */}
          {selectedNode.type === 'directory' && selectedNode.children && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                Contents ({selectedNode.children.length} items)
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedNode.children.map((child) => (
                  <div key={child.id} className="flex items-center gap-2 text-xs">
                    <span>{getFileIcon(child)}</span>
                    <span className="text-gray-300 truncate">{child.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real File System Status */}
          {isRealFileSystem && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-400 mb-2">🔗 Live File System</h4>
              <p className="text-xs text-green-200">
                This file exists on your computer. Operations will affect the actual file.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isRealFileSystem ? (
          <div className="space-y-3">
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Real File Operations</span>
              </div>
              <p className="text-xs text-yellow-200">
                These actions will modify files on your computer
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFileOperation('copy')}
                disabled={isOperating}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-3 rounded-lg transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => handleFileOperation('move')}
                disabled={isOperating}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-3 rounded-lg transition-colors text-sm"
              >
                <Move className="w-4 h-4" />
                Move
              </button>
            </div>

            {selectedNode.type === 'file' && (
              <button
                onClick={() => handleFileOperation('delete')}
                disabled={isOperating}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {isOperating ? 'Deleting...' : 'Delete File'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
              View Details
            </button>
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
              Demo Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};