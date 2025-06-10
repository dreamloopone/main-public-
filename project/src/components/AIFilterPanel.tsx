import React, { useState } from 'react';
import { Brain, Image, Video, FileText, Music, Archive, Filter, Sparkles } from 'lucide-react';

interface AIFilterPanelProps {
  onFilterChange: (filters: AIFilters) => void;
  aiEnabled: boolean;
}

export interface AIFilters {
  showImages: boolean;
  showVideos: boolean;
  showDocuments: boolean;
  showAudio: boolean;
  showArchives: boolean;
  showOther: boolean;
  groupSimilar: boolean;
  aiClustering: boolean;
}

export const AIFilterPanel: React.FC<AIFilterPanelProps> = ({ onFilterChange, aiEnabled }) => {
  const [filters, setFilters] = useState<AIFilters>({
    showImages: true,
    showVideos: true,
    showDocuments: true,
    showAudio: true,
    showArchives: true,
    showOther: true,
    groupSimilar: false,
    aiClustering: false
  });

  const updateFilter = (key: keyof AIFilters, value: boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const fileTypeFilters = [
    { key: 'showImages' as keyof AIFilters, label: 'Images', icon: <Image className="w-4 h-4" />, color: 'text-pink-400' },
    { key: 'showVideos' as keyof AIFilters, label: 'Videos', icon: <Video className="w-4 h-4" />, color: 'text-purple-400' },
    { key: 'showDocuments' as keyof AIFilters, label: 'Documents', icon: <FileText className="w-4 h-4" />, color: 'text-blue-400' },
    { key: 'showAudio' as keyof AIFilters, label: 'Audio', icon: <Music className="w-4 h-4" />, color: 'text-green-400' },
    { key: 'showArchives' as keyof AIFilters, label: 'Archives', icon: <Archive className="w-4 h-4" />, color: 'text-yellow-400' },
    { key: 'showOther' as keyof AIFilters, label: 'Other', icon: <Filter className="w-4 h-4" />, color: 'text-gray-400' }
  ];

  return (
    <div className="bg-gray-900/95 border-t border-gray-700/50 p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Smart Filters</h3>
          {!aiEnabled && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              AI Disabled
            </span>
          )}
        </div>

        {/* File Type Filters */}
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Show File Types:</h4>
          <div className="grid grid-cols-2 gap-2">
            {fileTypeFilters.map((filter) => (
              <label
                key={filter.key}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters[filter.key]}
                  onChange={(e) => updateFilter(filter.key, e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  filters[filter.key] 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-500'
                }`}>
                  {filters[filter.key] && (
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  )}
                </div>
                <div className={filter.color}>
                  {filter.icon}
                </div>
                <span className="text-sm text-gray-300">{filter.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Features */}
        {aiEnabled && (
          <div>
            <h4 className="text-sm text-gray-400 mb-2">AI Grouping:</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filters.groupSimilar}
                  onChange={(e) => updateFilter('groupSimilar', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  filters.groupSimilar 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-500'
                }`}>
                  {filters.groupSimilar && (
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  )}
                </div>
                <Sparkles className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Group Similar Files</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filters.aiClustering}
                  onChange={(e) => updateFilter('aiClustering', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  filters.aiClustering 
                    ? 'border-purple-500 bg-purple-500' 
                    : 'border-gray-500'
                }`}>
                  {filters.aiClustering && (
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  )}
                </div>
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">AI Content Clustering</span>
              </label>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              const allOn = { ...filters };
              Object.keys(allOn).forEach(key => {
                if (key.startsWith('show')) {
                  (allOn as any)[key] = true;
                }
              });
              setFilters(allOn);
              onFilterChange(allOn);
            }}
            className="flex-1 text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => {
              const allOff = { ...filters };
              Object.keys(allOff).forEach(key => {
                if (key.startsWith('show')) {
                  (allOff as any)[key] = false;
                }
              });
              setFilters(allOff);
              onFilterChange(allOff);
            }}
            className="flex-1 text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Hide All
          </button>
        </div>
      </div>
    </div>
  );
};