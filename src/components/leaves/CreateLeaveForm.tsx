import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SingleSelect } from '../ui/SingleSelect';
import type { CreateLeaveRequest, LeaveType } from '../../types';

interface CreateLeaveFormProps {
  onSubmit: (data: CreateLeaveRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: 'VACATION', label: 'Vacation' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal Leave' },
  { value: 'BEREAVEMENT', label: 'Bereavement Leave' },
  { value: 'PARENTAL', label: 'Parental Leave' },
  { value: 'TRAINING', label: 'Training/Conference' },
  { value: 'JURY_DUTY', label: 'Jury Duty' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'SABBATICAL', label: 'Sabbatical' },
  { value: 'PLANNED_VACATION', label: 'Planned Vacation' },
];

export const CreateLeaveForm: React.FC<CreateLeaveFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateLeaveRequest>({
    leaveType: 'VACATION',
    startDate: '',
    endDate: '',
    hoursPerDay: 8.0,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateLeaveRequest, value: any) => {
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

  const calculateTotalHours = () => {
    if (formData.startDate && formData.endDate && formData.hoursPerDay) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
      return daysDiff * formData.hoursPerDay;
    }
    return 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.leaveType) {
      newErrors.leaveType = 'Leave type is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (new Date(formData.startDate) <= new Date()) {
      newErrors.startDate = 'Start date must be in the future';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be on or after start date';
    }

    if (formData.hoursPerDay !== undefined && (formData.hoursPerDay < 0.5 || formData.hoursPerDay > 8)) {
      newErrors.hoursPerDay = 'Hours per day must be between 0.5 and 8';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
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
      // Clean up form data - remove empty strings for optional fields
      const cleanedData: CreateLeaveRequest = {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        hoursPerDay: formData.hoursPerDay || 8.0,
        ...(formData.description?.trim() && { description: formData.description.trim() })
      };

      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leave Details */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Details</h3>
        </div>

        <div>
          <SingleSelect
            label="Leave Type"
            value={formData.leaveType}
            onChange={(value) => handleInputChange('leaveType', value)}
            options={LEAVE_TYPE_OPTIONS}
          />
          {errors.leaveType && (
            <p className="mt-1 text-sm text-red-600">{errors.leaveType}</p>
          )}
        </div>

        <div>
          <Input
            label="Hours per Day"
            type="number"
            min="0.5"
            max="8"
            step="0.5"
            value={formData.hoursPerDay?.toString() || '8'}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleInputChange('hoursPerDay', isNaN(value) ? 8 : value);
            }}
            error={errors.hoursPerDay}
            placeholder="8.0"
          />
          <p className="text-sm text-gray-500 mt-1">Hours per day (0.5-8.0, supports partial days)</p>
        </div>

        {/* Date Range */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
        </div>

        <div>
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            error={errors.startDate}
            required
          />
        </div>

        <div>
          <Input
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            error={errors.endDate}
            required
          />
        </div>

        {/* Leave Summary */}
        {formData.startDate && formData.endDate && formData.hoursPerDay && (
          <div className="col-span-full p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Leave Summary</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Total Hours:</strong> {calculateTotalHours()} hours</p>
              <p><strong>Duration:</strong> {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 3600 * 24)) + 1} days</p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional description or reason for leave"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {(formData.description || '').length}/1000 characters
          </p>
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
          {isLoading ? 'Creating Leave...' : 'Create Leave'}
        </Button>
      </div>
    </form>
  );
};
