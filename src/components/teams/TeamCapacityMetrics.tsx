import React from 'react';
import { Card } from '../ui/Card';
import type { TeamCapacityMetrics as TeamCapacityMetricsType } from '../../types';

interface TeamCapacityMetricsProps {
  metrics: TeamCapacityMetricsType;
}

export const TeamCapacityMetrics: React.FC<TeamCapacityMetricsProps> = ({
  metrics,
}) => {
  const getCapacityStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-600';
      case 'AT_CAPACITY': return 'text-yellow-600';
      case 'OVER_ALLOCATED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCapacityStatusBg = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-50 border-green-200';
      case 'AT_CAPACITY': return 'bg-yellow-50 border-yellow-200';
      case 'OVER_ALLOCATED': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'HIGH': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'CRITICAL': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Capacity Overview */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Capacity Overview</h3>
          
          <div className={`p-4 rounded-lg border mb-6 ${getCapacityStatusBg(metrics.capacityStatus)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Overall Team Status</div>
                <div className={`text-xl font-bold ${getCapacityStatusColor(metrics.capacityStatus)}`}>
                  {metrics.capacityStatus.replace('_', ' ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Average Utilization</div>
                <div className={`text-xl font-bold ${getCapacityStatusColor(metrics.capacityStatus)}`}>
                  {metrics.averageUtilization.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{metrics.totalTeammates}</div>
              <div className="text-sm text-gray-500">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalBaseCapacity}h</div>
              <div className="text-sm text-gray-500">Base Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.totalAllocatedCapacity}h</div>
              <div className="text-sm text-gray-500">Allocated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.totalAvailableCapacity}h</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Upcoming Leave Impact</div>
              <div className="text-lg font-semibold text-amber-600">{metrics.upcomingLeaveDays} days</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Upcoming Holiday Impact</div>
              <div className="text-lg font-semibold text-orange-600">{metrics.upcomingHolidayDays} days</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Capacity Trends */}
      {metrics.capacityTrends && metrics.capacityTrends.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Trends</h3>
            <div className="space-y-4">
              {metrics.capacityTrends.map((trend, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-medium text-gray-900">{trend.period}</div>
                    <div className={`text-sm font-medium ${
                      trend.utilizationPercentage >= 100 ? 'text-red-600' :
                      trend.utilizationPercentage >= 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {trend.utilizationPercentage.toFixed(1)}% utilization
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Planned:</span>
                      <span className="ml-2 font-medium text-gray-900">{trend.plannedCapacity}h</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Actual:</span>
                      <span className="ml-2 font-medium text-gray-900">{trend.actualCapacity}h</span>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          trend.utilizationPercentage >= 100 ? 'bg-red-500' :
                          trend.utilizationPercentage >= 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(trend.utilizationPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Risk Factors */}
      {metrics.riskFactors && metrics.riskFactors.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
            <div className="space-y-4">
              {metrics.riskFactors.map((risk, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getRiskSeverityColor(risk.severity)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{risk.type.replace(/_/g, ' ')}</div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-70">
                      {risk.severity}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-3">{risk.description}</p>

                  {risk.impactedTeammates.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1">Impacted Team Members:</div>
                      <div className="flex flex-wrap gap-1">
                        {risk.impactedTeammates.map((teammate, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-white bg-opacity-70 rounded">
                            {teammate}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* No Risk Factors */}
      {(!metrics.riskFactors || metrics.riskFactors.length === 0) && (
        <Card>
          <div className="p-6 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Risk Factors Identified</h3>
            <p className="text-sm text-gray-500">Your team capacity is well-balanced with no immediate risks detected.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
