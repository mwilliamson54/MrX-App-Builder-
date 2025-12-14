import React from 'react';
import { ArtifactCard } from './ArtifactCard';

// ============================================================================
// ARTIFACT LIST COMPONENT
// ============================================================================

export const ArtifactList = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No artifacts yet</p>
    );
  }

  return (
    <div className="space-y-3">
      {artifacts.map((artifact, idx) => (
        <ArtifactCard key={idx} artifact={artifact} />
      ))}
    </div>
  );
};