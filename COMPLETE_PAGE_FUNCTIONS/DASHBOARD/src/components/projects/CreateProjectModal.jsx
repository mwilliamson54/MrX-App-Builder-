import React, { useState } from 'react';
import { Loader2, GitBranch } from 'lucide-react';
import { Modal, Input, Button } from '../ui';

// ============================================================================
// CREATE PROJECT MODAL COMPONENT
// ============================================================================

export const CreateProjectModal = ({ isOpen, onClose, onCreate, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    repoUrl: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.repoUrl.trim()) {
      newErrors.repoUrl = 'Repository URL is required';
    } else if (!isValidGitUrl(formData.repoUrl)) {
      newErrors.repoUrl = 'Please enter a valid Git repository URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidGitUrl = (url) => {
    const gitUrlPattern = /^(https?:\/\/)?(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/[\w-]+\/[\w-]+(\.git)?$/i;
    return gitUrlPattern.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const success = await onCreate(formData);
    
    if (success) {
      // Reset form
      setFormData({
        name: '',
        repoUrl: '',
        description: ''
      });
      setErrors({});
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="My Awesome App"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Repository URL *
          </label>
          <Input
            type="text"
            value={formData.repoUrl}
            onChange={(e) => handleChange('repoUrl', e.target.value)}
            placeholder="https://github.com/username/repo"
            icon={GitBranch}
            disabled={isLoading}
          />
          {errors.repoUrl && (
            <p className="text-red-400 text-xs mt-1">{errors.repoUrl}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            GitHub, GitLab, or Bitbucket URL
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of your project..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button 
            type="button"
            variant="ghost" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
