import React from 'react';

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      )}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${Icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
  );
};