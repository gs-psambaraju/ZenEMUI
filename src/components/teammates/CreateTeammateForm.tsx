import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SingleSelect } from '../ui/SingleSelect';
import { MultiSelect } from '../ui/MultiSelect';
import apiService from '../../services/api';
import type { CreateTeammateRequest, Team, RoleOption } from '../../types';

interface CreateTeammateFormProps {
  onSubmit: (data: CreateTeammateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialTeamId?: string;
}

// Dynamic roles

export const CreateTeammateForm: React.FC<CreateTeammateFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialTeamId,
}) => {
  const [formData, setFormData] = useState<CreateTeammateRequest>({
    name: '',
    email: '',
    role: 'DEVELOPER',
    secondaryRoles: [], // new array format
    teamId: initialTeamId || null,
    capacity: 40.0,
    // currentAllocation will be calculated by backend from team allocations
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [primaryRoles, setPrimaryRoles] = useState<RoleOption[]>([]);
  const [secondaryRoles, setSecondaryRoles] = useState<RoleOption[]>([]);

  // Load teams and roles for dropdowns
  useEffect(() => {
    const loadTeams = async () => {
      setTeamsLoading(true);
      try {
        const response = await apiService.getTeams({ page: 0, size: 100 });
        // Sort teams alphabetically by name
        const sortedTeams = response.content.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setTeams(sortedTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setTeamsLoading(false);
      }
    };
    const loadRoles = async () => {
      try {
        const [p, s] = await Promise.all([
          apiService.getPrimaryRoles(),
          apiService.getSecondaryRoles(),
        ]);
        setPrimaryRoles(p);
        setSecondaryRoles(s);
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };
    loadTeams();
    loadRoles();
  }, []);

  const handleInputChange = (field: keyof CreateTeammateRequest, value: any) => {
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
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be 255 characters or less';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.primaryRoleCode && !formData.role) {
      newErrors.role = 'Primary role is required';
    }

    if (formData.capacity !== undefined && (formData.capacity < 0 || formData.capacity > 80)) {
      newErrors.capacity = 'Capacity must be between 0 and 80 hours';
    }

    // currentAllocation is calculated by backend from team allocations

    // Validate secondary roles array
    if (formData.secondaryRoles && Array.isArray(formData.secondaryRoles)) {
      const duplicates = formData.secondaryRoles.filter((role, index) => 
        formData.secondaryRoles!.indexOf(role) !== index
      );
      if (duplicates.length > 0) {
        newErrors.secondaryRoles = 'Duplicate secondary roles are not allowed';
      }
      
      // Check if any secondary role matches the primary role
      if (formData.primaryRoleCode && formData.secondaryRoles.includes(formData.primaryRoleCode)) {
        newErrors.secondaryRoles = 'Secondary roles cannot include the primary role';
      }
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
      // Clean up form data
      const cleanedData: CreateTeammateRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(formData.primaryRoleCode ? { primaryRoleCode: formData.primaryRoleCode } : {}),
        ...(formData.secondaryRoles !== undefined ? { secondaryRoles: formData.secondaryRoles } : {}),
        ...(formData.secondaryRoleCode !== undefined ? { secondaryRoleCode: formData.secondaryRoleCode || null } : {}),
        ...(formData.role && !formData.primaryRoleCode ? { role: formData.role } : {}),
        teamId: formData.teamId || null,
        capacity: formData.capacity !== undefined ? formData.capacity : 40.0,
      };

      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  const teamOptions = [
    { value: '', label: 'Unassigned' },
    ...teams.map(team => ({ value: team.id, label: team.name }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        </div>

        <div>
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="Enter full name (max 255 characters)"
            maxLength={255}
          />
        </div>

        <div>
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
            placeholder="Enter email address"
          />
        </div>

        <div>
          <SingleSelect
            label="Primary Role"
            value={formData.primaryRoleCode || ''}
            onChange={(value) => handleInputChange('primaryRoleCode', value || undefined)}
            options={primaryRoles.map(r => ({ value: r.code, label: r.displayName }))}
            placeholder={primaryRoles.length ? 'Select primary role' : 'Loading roles...'}
          />
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Roles (optional)
          </label>
          <MultiSelect
            value={formData.secondaryRoles || []}
            onChange={(values) => handleInputChange('secondaryRoles', values)}
            options={secondaryRoles.map(r => ({ value: r.code, label: r.displayName }))}
            placeholder={secondaryRoles.length ? 'Select secondary roles...' : 'Loading roles...'}
            emptyText="No secondary roles found"
          />
          <p className="mt-1 text-xs text-gray-500">
            Select multiple secondary roles (e.g., Tech Lead + Code Reviewer)
          </p>
          {errors.secondaryRoles && (
            <p className="mt-1 text-sm text-red-600">{errors.secondaryRoles}</p>
          )}
        </div>

        <div>
          <SingleSelect
            label="Team Assignment"
            value={formData.teamId || ''}
            onChange={(value) => handleInputChange('teamId', value || null)}
            options={teamOptions}
            placeholder={teamsLoading ? 'Loading teams...' : 'Select team (optional)'}
          />
        </div>

        {/* Capacity Information */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Information</h3>
        </div>

        <div>
          <Input
            label="Capacity (Hours per Sprint)"
            type="number"
            min="0"
            max="80"
            step="0.5"
            value={formData.capacity !== undefined ? formData.capacity.toString() : '40'}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
              handleInputChange('capacity', isNaN(value as number) ? 40 : value);
            }}
            error={errors.capacity}
            placeholder="40.0"
          />
          <p className="text-sm text-gray-500 mt-1">Hours available per sprint (0-80)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Allocation</label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="text-sm text-gray-600">
              Will be calculated from team allocations after creation
            </div>
          </div>
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
          {isLoading ? 'Creating...' : 'Create Teammate'}
        </Button>
      </div>
    </form>
  );
};
