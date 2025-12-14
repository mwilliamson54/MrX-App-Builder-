import React from 'react';
import { Download } from 'lucide-react';
import { Badge, Button } from '../ui';

// ============================================================================
// ARTIFACT CARD COMPONENT
// ============================================================================

export const ArtifactCard = ({ artifact }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Download size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-gray-200">{artifact.filename}</span>
        </div>
        <Badge variant="success">Ready</Badge>
      </div>
      <div className="text-xs text-gray-400 space-y-1">
        <div>Size: {(artifact.size / 1024 / 1024).toFixed(2)} MB</div>
        <div>Built: {new Date(artifact.uploadedAt).toLocaleString()}</div>
      </div>
      <Button size="sm" className="w-full mt-3" icon={Download}>
        Download APK
      </Button>
    </div>
  );
};