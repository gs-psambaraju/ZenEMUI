import React from 'react';
import { Button } from '../ui/Button';
import type { TeammateLeave, LeaveType, LeaveStatus } from '../../types';

interface LeavesListProps {
  leaves: TeammateLeave[];
  onEditLeave?: (leave: TeammateLeave) => void;
  onDeleteLeave?: (leave: TeammateLeave) => void;
  isLoading?: boolean;
}

export const LeavesList: React.FC<LeavesListProps> = ({
  leaves,
  onEditLeave,
  onDeleteLeave,
  isLoading = false,
}) => {
  const getLeaveTypeBadgeColor = (leaveType: LeaveType) => {
    switch (leaveType) {
      case 'VACATION':
      case 'PLANNED_VACATION':
        return 'bg-green-100 text-green-800';
      case 'SICK':
        return 'bg-red-100 text-red-800';
      case 'PERSONAL':
        return 'bg-blue-100 text-blue-800';
      case 'BEREAVEMENT':
      case 'EMERGENCY':
        return 'bg-gray-100 text-gray-800';
      case 'PARENTAL':
        return 'bg-purple-100 text-purple-800';
      case 'TRAINING':
        return 'bg-yellow-100 text-yellow-800';
      case 'JURY_DUTY':
        return 'bg-orange-100 text-orange-800';
      case 'SABBATICAL':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: LeaveStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DENIED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLeaveType = (leaveType: LeaveType) => {
    return leaveType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading leaves...</p>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">No leaves found</p>
        <p className="text-sm text-gray-500">No leave requests have been submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leaves.map((leave) => (
        <div
          key={leave.id}
          className={`border rounded-lg p-4 ${
            isActive(leave.startDate, leave.endDate) ? 'border-blue-500 bg-blue-50' :
            isUpcoming(leave.startDate) ? 'border-green-500 bg-green-50' :
            'border-gray-200 bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLeaveTypeBadgeColor(leave.leaveType)}`}>
                  {formatLeaveType(leave.leaveType)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(leave.status)}`}>
                  {leave.status}
                </span>
                {isActive(leave.startDate, leave.endDate) && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
                {isUpcoming(leave.startDate) && !isActive(leave.startDate, leave.endDate) && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Upcoming
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Dates:</span>
                  <p className="font-medium text-gray-900">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <p className="font-medium text-gray-900">
                    {calculateDuration(leave.startDate, leave.endDate)} days
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Hours:</span>
                  <p className="font-medium text-gray-900">
                    {leave.totalHours} hours ({leave.hoursPerDay}h/day)
                  </p>
                </div>
              </div>

              {leave.description && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-900 mt-1">{leave.description}</p>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Created: {new Date(leave.createdAt).toLocaleDateString()}
                {leave.approvedBy && ` • Approved by: ${leave.approvedBy}`}
              </div>
            </div>

            {(onEditLeave || onDeleteLeave) && (
              <div className="ml-4 flex space-x-2">
                {onEditLeave && (
                  <Button
                    variant="outline"
                    onClick={() => onEditLeave(leave)}
                    disabled={leave.status === 'DENIED' || (!isUpcoming(leave.startDate) && !isActive(leave.startDate, leave.endDate))}
                    className="text-xs px-2 py-1"
                  >
                    Edit
                  </Button>
                )}
                {onDeleteLeave && (
                  <Button
                    variant="outline"
                    onClick={() => onDeleteLeave(leave)}
                    disabled={leave.status === 'DENIED' || isActive(leave.startDate, leave.endDate)}
                    className="text-xs px-2 py-1 text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
