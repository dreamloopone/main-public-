import React, { useState, useCallback } from 'react';
import { FolderOpen, Shield, AlertTriangle, CheckCircle, HardDrive } from 'lucide-react';
import { useFileSystemAPI } from '../hooks/useFileSystemAPI';

interface FileSystemAccessPanelProps {
  onDirectorySelected: (dirHandle: any, files: any[]) => void;
}

export const FileSystemAccessPanel: React.FC<FileSystemAccessPanelProps> = ({
  onDirectorySelected
}) => {
  const {
    isSupported,
    currentDirectory,
    error,
    requestDirectoryAccess,
    readDirectory,
    clearError
  } = useFileSystemAPI();

  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const handleRequestAccess = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      const dirHandle = await requestDirectoryAccess();
      
      if (dirHandle) {
        setHasPermission(true);
        
        // Read the directory contents
        const files = await readDirectory(dirHandle);
        onDirectorySelected(dirHandle, files);
      }
    } catch (err) {
      console.error('Failed to access directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [requestDirectoryAccess, readDirectory, onDirectorySelected, clearError]);

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-red-900/90 border border-red-700 rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Browser Not Supported</h2>
          <p className="text-red-200 mb-6">
            Your browser doesn't support the File System Access API. Please use:
          </p>
          <ul className="text-red-200 text-left space-y-2 mb-6">
            <li>• Chrome 86+ (Recommended)</li>
            <li>• Edge 86+</li>
            <li>• Opera 72+</li>
          </ul>
          <p className="text-red-300 text-sm">
            Firefox and Safari don't support this feature yet.
          </p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-lg">
          <div className="text-center mb-6">
            <HardDrive className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Connect to Your File System
            </h2>
            <p className="text-gray-400">
              Grant GLYPHOS access to a folder to begin 3D file exploration
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">Privacy & Security</h3>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Files stay on your computer - nothing uploaded</li>
                  <li>• You control which folder to access</li>
                  <li>• Permission can be revoked anytime</li>
                  <li>• All operations happen locally in your browser</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">Access Error</h3>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleRequestAccess}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Requesting Access...
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5" />
                Choose Folder to Explore
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Click to open your system's folder picker
          </p>
        </div>
      </div>
    );
  }

  // Permission granted - show success state briefly
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-green-900/90 border border-green-700 rounded-xl p-8 max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Granted!</h2>
        <p className="text-green-200 mb-4">
          Loading your files into 3D space...
        </p>
        <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
};