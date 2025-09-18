import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SingleSelect } from '../ui/SingleSelect';
import type { Project, UpdateProjectRequest, ProjectStatus, Priority, HealthStatus } from '../../types';

interface EditProjectFormProps {
  project: Project;
  onSubmit: (data: UpdateProjectRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const HEALTH_STATUS_OPTIONS: { value: HealthStatus; label: string }[] = [
  { value: 'GREEN', label: 'Green - On Track' },
  { value: 'YELLOW', label: 'Yellow - Some Concerns' },
  { value: 'RED', label: 'Red - At Risk' },
];

export const EditProjectForm: React.FC<EditProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateProjectRequest>({
    name: project.name,
    description: project.description,
    status: project.status,
    healthStatus: project.healthStatus,
    priority: project.priority,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UpdateProjectRequest, value: any) => {
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
      newErrors.name = 'Project name cannot be empty';
    } else if (formData.name && formData.name.length > 255) {
      newErrors.name = 'Project name must be 255 characters or less';
    }

    if (formData.actualStartDate && formData.actualEndDate && formData.actualStartDate > formData.actualEndDate) {
      newErrors.actualEndDate = 'Actual end date must be after actual start date';
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
          acc[key as keyof UpdateProjectRequest] = value;
        }
        return acc;
      }, {} as UpdateProjectRequest);

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
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
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

        {/* Status and Priority */}
        <div>
          <SingleSelect
            label="Status"
            value={formData.status || project.status}
            onChange={(value) => handleInputChange('status', value)}
            options={PROJECT_STATUS_OPTIONS}
          />
        </div>

        <div>
          <SingleSelect
            label="Health Status"
            value={formData.healthStatus || project.healthStatus}
            onChange={(value) => handleInputChange('healthStatus', value)}
            options={HEALTH_STATUS_OPTIONS}
          />
        </div>

        <div>
          <SingleSelect
            label="Priority"
            value={formData.priority || project.priority}
            onChange={(value) => handleInputChange('priority', value)}
            options={PRIORITY_OPTIONS}
          />
        </div>

        {/* Timeline Updates */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Updates</h3>
        </div>

        <div>
          <Input
            label="Actual Start Date"
            type="date"
            value={formData.actualStartDate || ''}
            onChange={(e) => handleInputChange('actualStartDate', e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Actual End Date"
            type="date"
            value={formData.actualEndDate || ''}
            onChange={(e) => handleInputChange('actualEndDate', e.target.value)}
            error={errors.actualEndDate}
          />
        </div>

        <div>
          <Input
            label="Actual Release Date"
            type="date"
            value={formData.actualReleaseDate || ''}
            onChange={(e) => handleInputChange('actualReleaseDate', e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Actual Deployment Date"
            type="date"
            value={formData.actualDeploymentDate || ''}
            onChange={(e) => handleInputChange('actualDeploymentDate', e.target.value)}
          />
        </div>

        {/* Team Reassignments */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Reassignments</h3>
        </div>

        <div>
          <Input
            label="Engineering Manager ID"
            value={formData.engineeringManagerId || ''}
            onChange={(e) => handleInputChange('engineeringManagerId', e.target.value)}
            placeholder="Enter new engineering manager ID"
          />
          {project.engineeringManagerName && (
            <p className="text-sm text-gray-500 mt-1">
              Current: {project.engineeringManagerName}
            </p>
          )}
        </div>

        <div>
          <Input
            label="Product Manager ID"
            value={formData.productManagerId || ''}
            onChange={(e) => handleInputChange('productManagerId', e.target.value)}
            placeholder="Enter new product manager ID"
          />
          {project.productManagerName && (
            <p className="text-sm text-gray-500 mt-1">
              Current: {project.productManagerName}
            </p>
          )}
        </div>

        {/* Jira Sync Updates */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jira Sync Updates</h3>
        </div>

        <div>
          <Input
            label="Jira Issue ID"
            value={formData.jiraIssueId || ''}
            onChange={(e) => handleInputChange('jiraIssueId', e.target.value)}
            placeholder="Enter Jira issue ID"
          />
          {project.jiraKey && (
            <p className="text-sm text-gray-500 mt-1">
              Current Jira Key: {project.jiraKey}
            </p>
          )}
        </div>

        {/* Release Version Updates */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Release Management</h3>
        </div>

        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Release Versions (replaces existing)
          </label>
          <textarea
            value={formData.releaseVersions?.join(', ') || ''}
            onChange={(e) => handleInputChange('releaseVersions', e.target.value.split(',').map(v => v.trim()).filter(v => v))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter release versions separated by commas (e.g., v2.0, v2.1)"
          />
          {project.releaseVersions && project.releaseVersions.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Current: {project.releaseVersions.join(', ')}
            </p>
          )}
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
          {isLoading ? 'Updating...' : 'Update Project'}
        </Button>
      </div>
    </form>
  );
};
