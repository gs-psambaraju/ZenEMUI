import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SingleSelect } from '../ui/SingleSelect';
import type { CreateProjectRequest, ProjectType, Priority, MocksStatus } from '../../types';

interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateProjectRequest>;
}

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'EPIC', label: 'Epic' },
  { value: 'FEATURE', label: 'Feature' },
  { value: 'INITIATIVE', label: 'Initiative' },
  { value: 'BUG_FIX', label: 'Bug Fix' },
  { value: 'TECHNICAL_DEBT', label: 'Technical Debt' },
  { value: 'RESEARCH', label: 'Research' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const MOCKS_STATUS_OPTIONS: { value: MocksStatus; label: string }[] = [
  { value: 'GROOMED', label: 'Groomed' },
  { value: 'YET_TO_BE_DISCUSSED', label: 'Yet to be Discussed' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
];

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = {},
}) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    teamId: '',
    projectType: 'EPIC',
    priority: 'MEDIUM',
    mocksStatus: 'YET_TO_BE_DISCUSSED',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateProjectRequest, value: any) => {
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

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Project name must be 255 characters or less';
    }

    if (!formData.teamId.trim()) {
      newErrors.teamId = 'Team is required';
    }

    if (formData.startDate && formData.targetEndDate && formData.startDate > formData.targetEndDate) {
      newErrors.targetEndDate = 'Target end date must be after start date';
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
      // Clean up form data - remove empty strings and undefined values
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as CreateProjectRequest);

      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        </div>

        <div className="col-span-full">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="Enter project name (max 255 characters)"
          />
        </div>

        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter project description"
          />
        </div>

        <div>
          <Input
            label="Team ID"
            value={formData.teamId}
            onChange={(e) => handleInputChange('teamId', e.target.value)}
            error={errors.teamId}
            required
            placeholder="Enter team ID"
          />
        </div>

        <div>
          <Input
            label="Initiative ID"
            value={formData.initiativeId || ''}
            onChange={(e) => handleInputChange('initiativeId', e.target.value)}
            placeholder="Enter initiative ID (optional)"
          />
        </div>

        <div>
          <SingleSelect
            label="Project Type"
            value={formData.projectType || 'EPIC'}
            onChange={(value) => handleInputChange('projectType', value)}
            options={PROJECT_TYPE_OPTIONS}
          />
        </div>

        <div>
          <SingleSelect
            label="Priority"
            value={formData.priority || 'MEDIUM'}
            onChange={(value) => handleInputChange('priority', value)}
            options={PRIORITY_OPTIONS}
          />
        </div>

        {/* Timeline Planning */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Planning</h3>
        </div>

        <div>
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Target End Date"
            type="date"
            value={formData.targetEndDate || ''}
            onChange={(e) => handleInputChange('targetEndDate', e.target.value)}
            error={errors.targetEndDate}
          />
        </div>

        <div>
          <Input
            label="Planned Release Date"
            type="date"
            value={formData.plannedReleaseDate || ''}
            onChange={(e) => handleInputChange('plannedReleaseDate', e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Planned Deployment Date"
            type="date"
            value={formData.plannedDeploymentDate || ''}
            onChange={(e) => handleInputChange('plannedDeploymentDate', e.target.value)}
          />
        </div>

        {/* Readiness Tracking */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Readiness Tracking</h3>
        </div>

        <div>
          <Input
            label="Groomed Date"
            type="date"
            value={formData.groomedDate || ''}
            onChange={(e) => handleInputChange('groomedDate', e.target.value)}
          />
        </div>

        <div>
          <SingleSelect
            label="Mocks Status"
            value={formData.mocksStatus || 'YET_TO_BE_DISCUSSED'}
            onChange={(value) => handleInputChange('mocksStatus', value)}
            options={MOCKS_STATUS_OPTIONS}
          />
        </div>

        <div>
          <Input
            label="Mocks Finalized Date"
            type="date"
            value={formData.mocksFinalizedDate || ''}
            onChange={(e) => handleInputChange('mocksFinalizedDate', e.target.value)}
          />
        </div>

        {/* Team Assignments */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Assignments</h3>
        </div>

        <div>
          <Input
            label="Engineering Manager ID"
            value={formData.engineeringManagerId || ''}
            onChange={(e) => handleInputChange('engineeringManagerId', e.target.value)}
            placeholder="Enter engineering manager ID"
          />
        </div>

        <div>
          <Input
            label="Product Manager ID"
            value={formData.productManagerId || ''}
            onChange={(e) => handleInputChange('productManagerId', e.target.value)}
            placeholder="Enter product manager ID"
          />
        </div>

        {/* Jira Integration */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jira Integration</h3>
        </div>

        <div>
          <Input
            label="Jira Key"
            value={formData.jiraKey || ''}
            onChange={(e) => handleInputChange('jiraKey', e.target.value)}
            placeholder="e.g., AUTH-123"
          />
        </div>

        <div>
          <Input
            label="Jira Connection ID"
            value={formData.jiraConnectionId || ''}
            onChange={(e) => handleInputChange('jiraConnectionId', e.target.value)}
            placeholder="Enter Jira connection ID"
          />
        </div>

        <div>
          <Input
            label="Jira Project Key"
            value={formData.jiraProjectKey || ''}
            onChange={(e) => handleInputChange('jiraProjectKey', e.target.value)}
            placeholder="e.g., AUTH"
          />
        </div>

        {/* Hierarchy */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hierarchy</h3>
        </div>

        <div>
          <Input
            label="Parent Project ID"
            value={formData.parentProjectId || ''}
            onChange={(e) => handleInputChange('parentProjectId', e.target.value)}
            placeholder="For sub-epics (optional)"
          />
        </div>

        {/* Release Management */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Release Management</h3>
        </div>

        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Release Versions
          </label>
          <textarea
            value={formData.releaseVersions?.join(', ') || ''}
            onChange={(e) => handleInputChange('releaseVersions', e.target.value.split(',').map(v => v.trim()).filter(v => v))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter release versions separated by commas (e.g., v2.0, v2.1)"
          />
          <p className="text-sm text-gray-500 mt-1">Separate multiple versions with commas</p>
        </div>
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
          {isLoading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};
