import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SingleSelect } from '../ui/SingleSelect';
import type { TeammateLeave, UpdateLeaveRequest, LeaveType, LeaveStatus } from '../../types';

interface EditLeaveFormProps {
  leave: TeammateLeave;
  onSubmit: (data: UpdateLeaveRequest) => Promise<void>;
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

const STATUS_OPTIONS: { value: LeaveStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const EditLeaveForm: React.FC<EditLeaveFormProps> = ({
  leave,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateLeaveRequest>({
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate,
    hoursPerDay: leave.hoursPerDay,
    description: leave.description,
    status: leave.status,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UpdateLeaveRequest, value: any) => {
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
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      return daysDiff * formData.hoursPerDay;
    }
    return leave.totalHours;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.startDate && new Date(formData.startDate) <= new Date()) {
      newErrors.startDate = 'Start date must be in the future';
    }

    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
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
      // Only send fields that have changed
      const changes: UpdateLeaveRequest = {};
      
      if (formData.leaveType && formData.leaveType !== leave.leaveType) {
        changes.leaveType = formData.leaveType;
      }
      
      if (formData.startDate && formData.startDate !== leave.startDate) {
        changes.startDate = formData.startDate;
      }
      
      if (formData.endDate && formData.endDate !== leave.endDate) {
        changes.endDate = formData.endDate;
      }
      
      if (formData.hoursPerDay !== undefined && formData.hoursPerDay !== leave.hoursPerDay) {
        changes.hoursPerDay = formData.hoursPerDay;
      }
      
      if (formData.description !== leave.description) {
        changes.description = formData.description?.trim() || '';
      }
      
      if (formData.status && formData.status !== leave.status) {
        changes.status = formData.status;
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

  const isUpcoming = new Date(leave.startDate) > new Date();
  const isActive = new Date() >= new Date(leave.startDate) && new Date() <= new Date(leave.endDate);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leave Status */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Details</h3>
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-sm text-gray-600">
              <strong>Current Status:</strong> {leave.status} • 
              <strong> Created:</strong> {new Date(leave.createdAt).toLocaleDateString()} • 
              <strong> Total Hours:</strong> {leave.totalHours}
            </p>
          </div>
        </div>

        <div>
          <SingleSelect
            label="Leave Type"
            value={formData.leaveType || leave.leaveType}
            onChange={(value) => handleInputChange('leaveType', value)}
            options={LEAVE_TYPE_OPTIONS}
          />
        </div>

        <div>
          <SingleSelect
            label="Status"
            value={formData.status || leave.status}
            onChange={(value) => handleInputChange('status', value)}
            options={STATUS_OPTIONS}
          />
        </div>

        <div>
          <Input
            label="Hours per Day"
            type="number"
            min="0.5"
            max="8"
            step="0.5"
            value={formData.hoursPerDay?.toString() || leave.hoursPerDay.toString()}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleInputChange('hoursPerDay', isNaN(value) ? leave.hoursPerDay : value);
            }}
            error={errors.hoursPerDay}
            placeholder="8.0"
          />
          <p className="text-sm text-gray-500 mt-1">Hours per day (0.5-8.0)</p>
        </div>

        {/* Date Range */}
        <div className="col-span-full mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
          {!isUpcoming && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This leave has already started or is in the past. Date changes may not be allowed.
              </p>
            </div>
          )}
        </div>

        <div>
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate || leave.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            error={errors.startDate}
            disabled={!isUpcoming}
          />
        </div>

        <div>
          <Input
            label="End Date"
            type="date"
            value={formData.endDate || leave.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            error={errors.endDate}
            disabled={isActive} // Can't change end date if leave is currently active
          />
        </div>

        {/* Leave Summary */}
        {formData.startDate && formData.endDate && formData.hoursPerDay && (
          <div className="col-span-full p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Updated Leave Summary</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Total Hours:</strong> {calculateTotalHours()} hours</p>
              <p><strong>Duration:</strong> {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 3600 * 24)) + 1} days</p>
              {calculateTotalHours() !== leave.totalHours && (
                <p className="text-blue-900 font-medium mt-1">
                  Change: {calculateTotalHours() > leave.totalHours ? '+' : ''}{calculateTotalHours() - leave.totalHours} hours
                </p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
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
          {isLoading ? 'Updating...' : 'Update Leave'}
        </Button>
      </div>
    </form>
  );
};
