import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Team, UpdateTeamRequest } from '../../types';

interface EditTeamFormProps {
  team: Team;
  onSubmit: (data: UpdateTeamRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditTeamForm: React.FC<EditTeamFormProps> = ({
  team,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateTeamRequest>({
    name: team.name,
    description: team.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UpdateTeamRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.name && !formData.name.trim()) {
      newErrors.name = 'Team name cannot be empty';
    } else if (formData.name && formData.name.length > 255) {
      newErrors.name = 'Team name must be 255 characters or less';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Only send fields that have changed
      const changes: UpdateTeamRequest = {};
      
      if (formData.name && formData.name.trim() !== team.name) {
        changes.name = formData.name.trim();
      }
      
      if (formData.description !== (team.description || '')) {
        changes.description = formData.description?.trim() || '';
      }

      // Only submit if there are actual changes
      if (Object.keys(changes).length > 0) {
        await onSubmit(changes);
      } else {
        onCancel(); // No changes, just close the form
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          label="Team Name"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          placeholder="Enter team name (max 255 characters)"
          maxLength={255}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter team description (optional, max 2000 characters)"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {(formData.description || '').length}/2000 characters
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Team'}
        </Button>
      </div>
    </form>
  );
};
