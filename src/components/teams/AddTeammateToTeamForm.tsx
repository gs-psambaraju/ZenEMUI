import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SingleSelect } from '../ui/SingleSelect';
import apiService from '../../services/api';
import { ROLE_OPTIONS, getRoleLabel } from '../../utils/roles';
import type { AvailableTeammate, AddTeammateToTeamRequest } from '../../types';

interface AddTeammateToTeamFormProps {
  teamId: string;
  onSubmit: (data: AddTeammateToTeamRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const AddTeammateToTeamForm: React.FC<AddTeammateToTeamFormProps> = ({
  teamId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<AddTeammateToTeamRequest>({
    teammateId: '',
    allocationPercentage: 100,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTeammates, setAvailableTeammates] = useState<AvailableTeammate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState<AvailableTeammate | null>(null);

  const handleInputChange = (field: keyof AddTeammateToTeamRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user changes input
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const searchAvailableTeammates = async () => {
    setIsSearching(true);
    try {
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole }),
        sortBy: 'remainingAllocationPercentage',
        sortDirection: 'DESC' as const,
      };
      const data = await apiService.getAvailableTeammates(teamId, params);
      setAvailableTeammates(data);
    } catch (error) {
      console.error('Failed to search available teammates:', error);
      setAvailableTeammates([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    searchAvailableTeammates();
  }, [teamId, searchTerm, selectedRole]);

  const handleTeammateSelect = (teammateId: string | null) => {
    if (!teammateId) return;
    const teammate = availableTeammates.find(t => t.id === teammateId);
    setSelectedTeammate(teammate || null);
    handleInputChange('teammateId', teammateId);
    
    // Auto-suggest allocation percentage based on remaining capacity
    if (teammate) {
      const suggestedAllocation = Math.min(teammate.remainingAllocationPercentage, 100);
      handleInputChange('allocationPercentage', suggestedAllocation);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.teammateId) {
      newErrors.teammateId = 'Please select a teammate';
    }

    if (!formData.allocationPercentage || formData.allocationPercentage <= 0) {
      newErrors.allocationPercentage = 'Allocation percentage must be greater than 0';
    } else if (formData.allocationPercentage > 100) {
      newErrors.allocationPercentage = 'Allocation percentage cannot exceed 100%';
    }

    // Check if teammate has enough remaining allocation
    if (selectedTeammate && formData.allocationPercentage > selectedTeammate.remainingAllocationPercentage) {
      newErrors.allocationPercentage = `Teammate only has ${selectedTeammate.remainingAllocationPercentage}% remaining allocation`;
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  const getCapacityStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-600';
      case 'AT_CAPACITY': return 'text-yellow-600';
      case 'OVER_ALLOCATED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const roleOptions = [{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS];

  const teammateOptions = availableTeammates.map(teammate => ({
    value: teammate.id,
    label: `${teammate.name} (${getRoleLabel(teammate.role)}) - ${teammate.remainingAllocationPercentage}% available`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Available Teammates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
          />
          <SingleSelect
            label="Filter by role"
            value={selectedRole}
            onChange={(value) => setSelectedRole(value || '')}
            options={roleOptions}
          />
        </div>

        {isSearching && (
          <div className="text-sm text-gray-500">Searching available teammates...</div>
        )}
      </div>

      {/* Teammate Selection */}
      <div>
        <SingleSelect
          label="Select Teammate"
          value={formData.teammateId}
          onChange={handleTeammateSelect}
          options={teammateOptions}
          placeholder={availableTeammates.length === 0 ? 'No available teammates found' : 'Choose a teammate...'}
        />
        {errors.teammateId && (
          <p className="mt-1 text-sm text-red-600">{errors.teammateId}</p>
        )}
      </div>

      {/* Selected Teammate Details */}
      {selectedTeammate && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Teammate Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-medium">Base Capacity:</span> {selectedTeammate.baseCapacity}h
            </div>
            <div>
              <span className="font-medium">Available Hours:</span> {selectedTeammate.availableHours}h
            </div>
            <div>
              <span className="font-medium">Current Allocations:</span> {selectedTeammate.totalAllocationPercentage}%
            </div>
            <div>
              <span className="font-medium">Remaining:</span> {selectedTeammate.remainingAllocationPercentage}%
            </div>
            <div className="col-span-2">
              <span className="font-medium">Status:</span> 
              <span className={`ml-1 ${getCapacityStatusColor(selectedTeammate.capacityStatus)}`}>
                {selectedTeammate.capacityStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Current Allocations */}
          {selectedTeammate.currentAllocations.length > 0 && (
            <div className="mt-3">
              <span className="font-medium text-blue-900">Current Team Allocations:</span>
              <div className="mt-1 space-y-1">
                {selectedTeammate.currentAllocations.map((allocation, index) => (
                  <div key={index} className="text-sm text-blue-700">
                    • {allocation.teamName}: {allocation.allocationPercentage}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Leaves */}
          {selectedTeammate.upcomingLeaves.length > 0 && (
            <div className="mt-3">
              <span className="font-medium text-blue-900">Upcoming Leaves:</span>
              <div className="mt-1 space-y-1">
                {selectedTeammate.upcomingLeaves.slice(0, 2).map((leave, index) => (
                  <div key={index} className="text-sm text-blue-700">
                    • {leave.leaveType.replace('_', ' ')}: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.totalHours}h)
                  </div>
                ))}
                {selectedTeammate.upcomingLeaves.length > 2 && (
                  <div className="text-sm text-blue-600">
                    +{selectedTeammate.upcomingLeaves.length - 2} more leaves
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Allocation Percentage */}
      <div>
        <Input
          label="Allocation Percentage"
          type="number"
          min="1"
          max="100"
          step="1"
          value={formData.allocationPercentage?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            handleInputChange('allocationPercentage', isNaN(value) ? 0 : value);
          }}
          error={errors.allocationPercentage}
          placeholder="100"
        />
        <p className="text-sm text-gray-500 mt-1">
          Percentage of this teammate's capacity allocated to this team (1-100%)
        </p>
      </div>

      {/* Allocation Preview */}
      {selectedTeammate && formData.allocationPercentage && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Allocation Preview</h4>
          <div className="text-sm text-green-800">
            <p><strong>Allocated Hours:</strong> {Math.round(selectedTeammate.baseCapacity * formData.allocationPercentage / 100)}h per sprint</p>
            <p><strong>Remaining After Assignment:</strong> {selectedTeammate.remainingAllocationPercentage - formData.allocationPercentage}% available for other teams</p>
          </div>
        </div>
      )}

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
          disabled={isLoading || !formData.teammateId || !formData.allocationPercentage}
        >
          {isLoading ? 'Adding Teammate...' : 'Add Teammate'}
        </Button>
      </div>
    </form>
  );
};
