import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, File } from 'lucide-react';

// ============================================================================
// FILE TREE ITEM COMPONENT
// ============================================================================

export const FileTreeItem = ({ item, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFolder = item.type === 'folder';

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
            setIsExpanded(!isExpanded);
          } else {
            onSelect(item.path);
          }
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded text-sm text-gray-300"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {isFolder ? (
          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : null}
        {isFolder ? <Folder size={14} className="text-blue-400" /> : <File size={14} className="text-gray-500" />}
        <span className="flex-1 text-left truncate">{item.name}</span>
      </button>

      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map((child, idx) => (
            <FileTreeItem key={idx} item={child} level={level + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};