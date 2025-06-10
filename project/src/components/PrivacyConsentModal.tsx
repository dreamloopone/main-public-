import React, { useState } from 'react';
import { Shield, Eye, Brain, Clock, X } from 'lucide-react';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onAccept: (permissions: string[]) => void;
  onDecline: () => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  if (!isOpen) return null;

  const permissions = [
    {
      id: 'image_analysis',
      title: 'Image Similarity Analysis',
      description: 'Analyze image content to group similar photos and detect duplicates',
      icon: <Eye className="w-5 h-5" />,
      required: false
    },
    {
      id: 'content_clustering',
      title: 'Smart Content Grouping',
      description: 'Use AI to automatically organize files by content and context',
      icon: <Brain className="w-5 h-5" />,
      required: false
    },
    {
      id: 'usage_patterns',
      title: 'Usage Pattern Learning',
      description: 'Learn from your file organization habits to provide better suggestions',
      icon: <Clock className="w-5 h-5" />,
      required: false
    }
  ];

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleAccept = () => {
    onAccept(selectedPermissions);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">AI-Powered File Analysis</h2>
                <p className="text-gray-400 text-sm">Choose your privacy preferences</p>
              </div>
            </div>
            <button
              onClick={onDecline}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Privacy Promise */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">🔒 Our Privacy Promise</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• We only analyze file metadata, never store actual file contents</li>
              <li>• All data transmission is encrypted end-to-end</li>
              <li>• You can revoke permissions or delete your data anytime</li>
              <li>• AI processing happens in secure, GDPR-compliant cloud infrastructure</li>
            </ul>
          </div>

          {/* Permission Options */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Select AI Features to Enable:</h3>
            
            {permissions.map((permission) => (
              <div
                key={permission.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPermissions.includes(permission.id)
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => togglePermission(permission.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-blue-400">
                      {permission.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{permission.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">{permission.description}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedPermissions.includes(permission.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                    }`}>
                      {selectedPermissions.includes(permission.id) && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Data Retention Info */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-gray-300 font-medium mb-2">Data Retention & Control</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• Analysis results stored for 30 days to improve performance</p>
              <p>• You can delete all AI data from your account settings</p>
              <p>• Disable any feature anytime without losing your files</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Use Without AI
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {selectedPermissions.length > 0 
              ? `Enable ${selectedPermissions.length} Feature${selectedPermissions.length > 1 ? 's' : ''}`
              : 'Continue Without AI'
            }
          </button>
        </div>
      </div>
    </div>
  );
};