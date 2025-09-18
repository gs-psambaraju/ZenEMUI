import React from 'react';
import { Button } from '../ui/Button';
import type { TeamAllocation, TeammateRole } from '../../types';
import { getRoleLabel } from '../../utils/roles';

interface TeamAllocationsListProps {
  allocations: TeamAllocation[];
  onEditAllocation?: (allocation: TeamAllocation) => void;
  onRemoveTeammate?: (allocation: TeamAllocation) => void;
  isLoading?: boolean;
}

export const TeamAllocationsList: React.FC<TeamAllocationsListProps> = ({
  allocations,
  onEditAllocation,
  onRemoveTeammate,
  isLoading = false,
}) => {
  const getRoleBadgeColor = (role: TeammateRole) => {
    switch (role) {
      case 'EM': return 'bg-purple-100 text-purple-800';
      case 'PM': return 'bg-blue-100 text-blue-800';
      case 'DEVELOPER': return 'bg-green-100 text-green-800';
      case 'QA': return 'bg-yellow-100 text-yellow-800';
      case 'DESIGNER': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 100) return 'text-red-600';
    if (utilization >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization >= 100) return 'bg-red-500';
    if (utilization >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading team allocations...</p>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.12l-.785 1.09M17 20h-10a3 3 0 01-3-3v-2a7.945 7.945 0 011.464-4.598l1.21 1.212M17 20v-2a3 3 0 00-3-3v-5a5 5 0 00-5-5v2m5 3h-5a5 5 0 00-5 5v5a3 3 0 003 3h10a3 3 0 003-3v-2z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">No team members yet</p>
        <p className="text-sm text-gray-500">Add teammates to this team to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allocations.map((allocation) => (
        <div
          key={allocation.teammateId}
          className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{allocation.teammateName}</h3>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(allocation.teammateRole)}`}>
                  {getRoleLabel(allocation.teammateRole)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{allocation.teammateEmail}</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Allocation</div>
                  <div className="text-lg font-semibold text-gray-900">{allocation.allocationPercentage}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Base Capacity</div>
                  <div className="text-lg font-semibold text-gray-900">{allocation.baseCapacity}h</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Allocated Hours</div>
                  <div className="text-lg font-semibold text-blue-600">{allocation.allocatedHours}h</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Available Hours</div>
                  <div className="text-lg font-semibold text-green-600">{allocation.availableHours}h</div>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Current Utilization</span>
                  <span className={getUtilizationColor(allocation.currentUtilization)}>
                    {allocation.currentUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getUtilizationBgColor(allocation.currentUtilization)}`}
                    style={{ width: `${Math.min(allocation.currentUtilization, 100)}%` }}
                  />
                </div>
                {allocation.currentUtilization > 100 && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Over-allocated by {(allocation.currentUtilization - 100).toFixed(1)}%</p>
                )}
              </div>

              {/* Upcoming Leaves */}
              {allocation.upcomingLeaves.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Upcoming Leaves</div>
                  <div className="space-y-1">
                    {allocation.upcomingLeaves.slice(0, 2).map((leave, index) => (
                      <div key={index} className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        {leave.leaveType.replace(/_/g, ' ')}: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.totalHours}h)
                      </div>
                    ))}
                    {allocation.upcomingLeaves.length > 2 && (
                      <div className="text-xs text-amber-600">
                        +{allocation.upcomingLeaves.length - 2} more upcoming leaves
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Added: {new Date(allocation.createdAt).toLocaleDateString()}
                {allocation.updatedAt !== allocation.createdAt && (
                  <span> • Updated: {new Date(allocation.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            {(onEditAllocation || onRemoveTeammate) && (
              <div className="ml-6 flex flex-col space-y-2">
                {onEditAllocation && (
                  <Button
                    variant="outline"
                    onClick={() => onEditAllocation(allocation)}
                    className="text-xs px-3 py-1"
                  >
                    Edit Allocation
                  </Button>
                )}
                {onRemoveTeammate && (
                  <Button
                    variant="outline"
                    onClick={() => onRemoveTeammate(allocation)}
                    className="text-xs px-3 py-1 text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Remove
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
