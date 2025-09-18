import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SingleSelect } from '../ui/SingleSelect';
import { MultiSelect } from '../ui/MultiSelect';
import apiService from '../../services/api';
import type { Teammate, UpdateTeammateRequest, Team, RoleOption } from '../../types';

interface EditTeammateFormProps {
  teammate: Teammate;
  onSubmit: (data: UpdateTeammateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Dynamic roles

export const EditTeammateForm: React.FC<EditTeammateFormProps> = ({
  teammate,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateTeammateRequest>({
    name: teammate.name,
    email: teammate.email,
    role: teammate.role,
    primaryRoleCode: (teammate as any).primaryRoleCode,
    secondaryRoleCode: (teammate as any).secondaryRoleCode, // legacy
    secondaryRoles: (teammate as any).secondaryRoles || [], // new array format
    teamId: teammate.teamId,
    capacity: teammate.capacity,
    // currentAllocation is calculated by backend, not user input
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [primaryRoles, setPrimaryRoles] = useState<RoleOption[]>([]);
  const [secondaryRoles, setSecondaryRoles] = useState<RoleOption[]>([]);

  // Load teams and roles for dropdown
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
        console.log('Loading roles...');
        const [p, s] = await Promise.all([
          apiService.getPrimaryRoles(),
          apiService.getSecondaryRoles(),
        ]);
        console.log('Primary roles received:', p);
        console.log('Secondary roles received:', s);
        setPrimaryRoles(p);
        setSecondaryRoles(s);
        console.log('Roles set in state');
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };
    loadTeams();
    loadRoles();
  }, []);

  const handleInputChange = (field: keyof UpdateTeammateRequest, value: any) => {
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
      newErrors.name = 'Name cannot be empty';
    } else if (formData.name && formData.name.length > 255) {
      newErrors.name = 'Name must be 255 characters or less';
    }

    if (formData.email && !formData.email.trim()) {
      newErrors.email = 'Email cannot be empty';
    } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
      // Only send fields that have changed
      const changes: UpdateTeammateRequest = {};
      
      if (formData.name && formData.name.trim() !== teammate.name) {
        changes.name = formData.name.trim();
      }
      
      if (formData.email && formData.email.trim() !== teammate.email) {
        changes.email = formData.email.trim();
      }
      
      if (formData.primaryRoleCode && formData.primaryRoleCode !== teammate.primaryRoleCode) {
        changes.primaryRoleCode = formData.primaryRoleCode;
      }
      
      // Handle new multiple secondary roles
      if (formData.secondaryRoles !== undefined) {
        const currentSecondaryRoles = (teammate as any).secondaryRoles || [];
        const hasChanged = JSON.stringify(formData.secondaryRoles?.sort()) !== JSON.stringify(currentSecondaryRoles.sort());
        if (hasChanged) {
          changes.secondaryRoles = formData.secondaryRoles;
        }
      }
      // Legacy single secondary role (backward compatibility)
      else if (formData.secondaryRoleCode !== undefined && formData.secondaryRoleCode !== teammate.secondaryRoleCode) {
        changes.secondaryRoleCode = formData.secondaryRoleCode;
      }
      
      if (formData.role && formData.role !== teammate.role && !formData.primaryRoleCode) {
        changes.role = formData.role; // legacy
      }
      
      if (formData.teamId !== teammate.teamId) {
        changes.teamId = formData.teamId;
      }
      
      if (formData.capacity !== undefined && formData.capacity !== teammate.capacity) {
        changes.capacity = formData.capacity;
      }
      
      // currentAllocation is calculated by backend, not user-editable

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
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter full name (max 255 characters)"
            maxLength={255}
          />
        </div>

        <div>
          <Input
            label="Email Address"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            placeholder="Enter email address"
          />
        </div>

        <div>
          <SingleSelect
            label="Primary Role"
            value={(() => {
              // Try to find by code first, then by display name
              const currentValue = formData.primaryRoleCode || (teammate as any).primaryRoleCode || (teammate as any).primaryRoleDisplayName;
              if (!currentValue) return '';
              
              // Check if current value matches a code
              const byCode = primaryRoles.find(r => r.code === currentValue);
              if (byCode) return byCode.code;
              
              // Check if current value matches a display name
              const byDisplayName = primaryRoles.find(r => r.displayName === currentValue);
              if (byDisplayName) return byDisplayName.code;
              
              return '';
            })()}
            onChange={(value) => handleInputChange('primaryRoleCode', value || undefined)}
            options={primaryRoles.map(r => ({ value: r.code, label: r.displayName }))}
            placeholder={primaryRoles.length ? 'Select primary role' : 'Loading roles...'}
          />
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
          {teammate.teamName && (
            <p className="text-sm text-gray-500 mt-1">
              Current: {teammate.teamName}
            </p>
          )}
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
            value={formData.capacity?.toString() || teammate.capacity.toString()}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleInputChange('capacity', isNaN(value) ? 40 : value);
            }}
            error={errors.capacity}
            placeholder="40.0"
          />
          <p className="text-sm text-gray-500 mt-1">Hours available per sprint (0-80)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Allocation (%)</label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="text-lg font-semibold text-gray-900">
              {teammate.currentAllocation?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Calculated from active team allocations (read-only)
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="col-span-full mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Assigned Epics:</span> {teammate.assignedProjectCount}
            </div>
            <div>
              <span className="font-medium">Member Since:</span> {
                teammate.createdAt 
                  ? new Date(teammate.createdAt).toLocaleDateString()
                  : 'N/A'
              }
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
          {isLoading ? 'Updating...' : 'Update Teammate'}
        </Button>
      </div>
    </form>
  );
};
