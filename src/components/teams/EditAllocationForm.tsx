import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { TeamAllocation, UpdateTeamAllocationRequest } from '../../types';

interface EditAllocationFormProps {
  allocation: TeamAllocation;
  onSubmit: (data: UpdateTeamAllocationRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditAllocationForm: React.FC<EditAllocationFormProps> = ({
  allocation,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateTeamAllocationRequest>({
    allocationPercentage: allocation.allocationPercentage,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UpdateTeamAllocationRequest, value: any) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.allocationPercentage || formData.allocationPercentage <= 0) {
      newErrors.allocationPercentage = 'Allocation percentage must be greater than 0';
    } else if (formData.allocationPercentage > 100) {
      newErrors.allocationPercentage = 'Allocation percentage cannot exceed 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Only submit if there are actual changes
    if (formData.allocationPercentage === allocation.allocationPercentage) {
      onCancel(); // No changes, just close the form
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  const calculateNewAllocatedHours = () => {
    return Math.round(allocation.baseCapacity * (formData.allocationPercentage || 0) / 100);
  };

  const getCurrentAllocatedHours = () => {
    return Math.round(allocation.baseCapacity * allocation.allocationPercentage / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Teammate Details */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">{allocation.teammateName}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Role:</span> {allocation.teammateRole}
          </div>
          <div>
            <span className="font-medium">Email:</span> {allocation.teammateEmail}
          </div>
          <div>
            <span className="font-medium">Base Capacity:</span> {allocation.baseCapacity}h
          </div>
          <div>
            <span className="font-medium">Current Allocation:</span> {allocation.allocationPercentage}%
          </div>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{getCurrentAllocatedHours()}h</div>
          <div className="text-sm text-gray-500">Current Hours</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">{allocation.availableHours}h</div>
          <div className="text-sm text-gray-500">Available Hours</div>
        </div>
        <div>
          <div className={`text-lg font-semibold ${
            allocation.currentUtilization >= 100 ? 'text-red-600' :
            allocation.currentUtilization >= 80 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {allocation.currentUtilization.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Utilization</div>
        </div>
      </div>

      {/* Allocation Percentage Input */}
      <div>
        <Input
          label="New Allocation Percentage"
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
          placeholder="50"
        />
        <p className="text-sm text-gray-500 mt-1">
          Percentage of this teammate's capacity allocated to this team (1-100%)
        </p>
      </div>

      {/* Allocation Preview */}
      {formData.allocationPercentage && formData.allocationPercentage !== allocation.allocationPercentage && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Allocation Change Preview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-medium">New Allocated Hours:</span> {calculateNewAllocatedHours()}h per sprint
            </div>
            <div>
              <span className="font-medium">Change:</span> 
              {calculateNewAllocatedHours() > getCurrentAllocatedHours() ? '+' : ''}
              {calculateNewAllocatedHours() - getCurrentAllocatedHours()}h per sprint
            </div>
          </div>
        </div>
      )}

      {/* Warning for significant changes */}
      {formData.allocationPercentage && (
        Math.abs(formData.allocationPercentage - allocation.allocationPercentage) >= 20
      ) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Significant Allocation Change</h3>
              <div className="mt-1 text-sm text-amber-700">
                This change of {Math.abs(formData.allocationPercentage - allocation.allocationPercentage)}% 
                may significantly impact team capacity and project assignments.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Leaves Warning */}
      {allocation.upcomingLeaves.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Upcoming Leaves</h3>
              <div className="mt-1 text-sm text-orange-700">
                This teammate has {allocation.upcomingLeaves.length} upcoming leave(s) that will affect availability.
              </div>
            </div>
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
          disabled={isLoading || !formData.allocationPercentage || formData.allocationPercentage === allocation.allocationPercentage}
        >
          {isLoading ? 'Updating...' : 'Update Allocation'}
        </Button>
      </div>
    </form>
  );
};
