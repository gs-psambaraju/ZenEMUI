import React from 'react';
import { Card } from '../ui/Card';
import type { CapacityBreakdown as CapacityBreakdownType } from '../../types';

interface CapacityBreakdownProps {
  breakdown: CapacityBreakdownType;
}

export const CapacityBreakdown: React.FC<CapacityBreakdownProps> = ({
  breakdown,
}) => {
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLeaveType = (leaveType: string) => {
    return leaveType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAdjustmentType = (adjustmentType: string) => {
    return adjustmentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Capacity Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Summary</h3>
          
          {breakdown.sprintId && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Sprint:</strong> {breakdown.sprintName || breakdown.sprintId}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{breakdown.baseHours}h</div>
              <div className="text-sm text-gray-500">Base Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">-{breakdown.leaveHours + breakdown.holidayHours}h</div>
              <div className="text-sm text-gray-500">Leave + Holidays</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{breakdown.customAdjustmentHours > 0 ? '+' : ''}{breakdown.customAdjustmentHours}h</div>
              <div className="text-sm text-gray-500">Adjustments</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getUtilizationColor(breakdown.utilizationPercentage)}`}>
                {breakdown.availableHours}h
              </div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>

          {/* Capacity Formula */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Calculation</h4>
            <div className="text-sm text-gray-700 font-mono">
              {breakdown.baseHours}h (base) - {breakdown.leaveHours}h (leaves) - {breakdown.holidayHours}h (holidays) - {breakdown.meetingHours}h (meetings) {breakdown.customAdjustmentHours > 0 ? '+' : ''} {breakdown.customAdjustmentHours}h (adjustments) = <strong>{breakdown.availableHours}h available</strong>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Capacity Utilization</span>
              <span className={getUtilizationColor(breakdown.utilizationPercentage)}>
                {breakdown.utilizationPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getUtilizationBgColor(breakdown.utilizationPercentage)}`}
                style={{ width: `${Math.min(breakdown.utilizationPercentage, 100)}%` }}
              />
            </div>
            {breakdown.utilizationPercentage > 100 && (
              <p className="text-xs text-red-600 mt-1">⚠️ Over-allocated by {(breakdown.utilizationPercentage - 100).toFixed(1)}%</p>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Last calculated: {new Date(breakdown.calculationDate).toLocaleString()}
          </div>
        </div>
      </Card>

      {/* Leave Breakdown */}
      {breakdown.leaves.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Leave Impact</h3>
            <div className="space-y-3">
              {breakdown.leaves.map((leave, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{formatLeaveType(leave.leaveType)}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                    {leave.description && (
                      <div className="text-sm text-gray-500 mt-1">{leave.description}</div>
                    )}
                  </div>
                  <div className="text-red-600 font-medium">-{leave.hours}h</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Holiday Breakdown */}
      {breakdown.holidays.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Holiday Impact</h3>
            <div className="space-y-3">
              {breakdown.holidays.map((holiday, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{holiday.holidayName}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(holiday.holidayDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-orange-600 font-medium">-{holiday.hours}h</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Adjustments Breakdown */}
      {breakdown.adjustments.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Adjustments</h3>
            <div className="space-y-3">
              {breakdown.adjustments.map((adjustment, index) => (
                <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${
                  adjustment.hours > 0 ? 'bg-green-50' : 'bg-purple-50'
                }`}>
                  <div>
                    <div className="font-medium text-gray-900">{formatAdjustmentType(adjustment.adjustmentType)}</div>
                    <div className="text-sm text-gray-600">{adjustment.description}</div>
                  </div>
                  <div className={`font-medium ${adjustment.hours > 0 ? 'text-green-600' : 'text-purple-600'}`}>
                    {adjustment.hours > 0 ? '+' : ''}{adjustment.hours}h
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
