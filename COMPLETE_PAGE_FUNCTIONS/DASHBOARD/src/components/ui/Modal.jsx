import React from 'react';
import { X } from 'lucide-react';

// ============================================================================
// MODAL COMPONENT - MOBILE RESPONSIVE
// ============================================================================

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-gray-800 rounded-t-2xl md:rounded-xl shadow-2xl border-t md:border border-gray-700 w-full md:max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden animate-slide-in-up md:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-200 p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-4rem)] md:max-h-[calc(85vh-5rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};