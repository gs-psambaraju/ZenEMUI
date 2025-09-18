import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { apiService } from '../../services/api';
import type { 
  ConnectionTargetStatus, 
  ScheduledRefreshJob, 
  RefreshHistoryEntry, 
  StartRefreshResponse,
  RefreshTarget 
} from '../../types';
import type { PageResponse } from '../../services/api';

interface ConnectorRefreshTabProps {
  connectorId: string;
  onRefreshStarted?: (orchestrationId: string) => void;
}

export const ConnectorRefreshTab: React.FC<ConnectorRefreshTabProps> = ({
  connectorId,
  onRefreshStarted,
}) => {
  const { show } = useToast();
  const [targets, setTargets] = useState<ConnectionTargetStatus[]>([]);
  const [schedules, setSchedules] = useState<ScheduledRefreshJob[]>([]);
  const [history, setHistory] = useState<PageResponse<RefreshHistoryEntry> | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<RefreshTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  useEffect(() => {
    loadRefreshData();
  }, [connectorId]);

  const loadRefreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [targetsData, schedulesData, historyData] = await Promise.all([
        apiService.getConnectionTargets(connectorId),
        apiService.getScheduledRefreshJobs(connectorId),
        apiService.getRefreshHistory({ connectionId: connectorId, page: 0, size: 10 }),
      ]);

      setTargets(targetsData);
      setSchedules(schedulesData);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle target selection
  const handleTargetSelect = (target: RefreshTarget) => {
    setSelectedTargets(prev => 
      prev.includes(target) 
        ? prev.filter(t => t !== target)
        : [...prev, target]
    );
  };

  // Handle bulk refresh
  const handleBulkRefresh = async () => {
    if (selectedTargets.length === 0) {
      show({ title: 'No Targets Selected', description: 'Please select at least one target to refresh.', type: 'error' });
      return;
    }

    setIsRefreshing(true);
    
    try {
      const response = await apiService.startRefresh({
        targets: selectedTargets,
        connectionIds: [connectorId],
        description: `Bulk refresh from connector ${connectorId}`,
      });

      show({ 
        title: 'Refresh Started', 
        description: `Started refreshing ${selectedTargets.length} targets. Estimated completion: ${Math.round(response.estimatedDurationSeconds / 60)} minutes.`, 
        type: 'success' 
      });

      if (onRefreshStarted) {
        onRefreshStarted(response.orchestrationId);
      }

      // Clear selection and reload data
      setSelectedTargets([]);
      setTimeout(loadRefreshData, 1000);
    } catch (err) {
      show({ 
        title: 'Refresh Failed', 
        description: err instanceof Error ? err.message : 'Failed to start refresh', 
        type: 'error' 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format staleness level
  const getStalenessColor = (level: string) => {
    switch (level) {
      case 'FRESH': return 'text-green-600';
      case 'STALE': return 'text-yellow-600';
      case 'VERY_STALE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Format timestamp
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card className="text-center py-8">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Loading refresh data...</h3>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <Icon name="warning" className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Refresh Data</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadRefreshData}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Targets */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Refresh Targets</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={loadRefreshData}
                className="flex items-center space-x-1"
              >
                <Icon name="arrow-path" className="h-4 w-4" />
                <span>Reload</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkRefresh}
                disabled={selectedTargets.length === 0 || isRefreshing}
                isLoading={isRefreshing}
                className="flex items-center space-x-1"
              >
                <Icon name="play" className="h-4 w-4" />
                <span>Refresh Selected ({selectedTargets.length})</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {targets.length === 0 && (
              <p className="text-gray-500 text-center py-4">No refresh targets available for this connection.</p>
            )}
            
            {targets.map(target => (
              <div key={target.target} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(target.target)}
                      onChange={() => handleTargetSelect(target.target)}
                      disabled={!target.supported}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{target.displayName}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <span>Target: {target.target}</span>
                        {target.recordsLastSync && (
                          <>
                            <span>•</span>
                            <span>{target.recordsLastSync} records last sync</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ~{Math.round(target.estimatedDurationSeconds / 60)}min
                      </div>
                      <div className="text-xs text-gray-500">estimated</div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStalenessColor(target.stalenessLevel)}`}>
                        {target.stalenessLevel.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(target.lastRefreshAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Scheduled Jobs */}
      {schedules.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Refresh Jobs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Run
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Success
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map(job => (
                    <tr key={job.jobId}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {job.jobName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {job.jobType.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Every {Math.round(job.syncFrequencyMinutes / 60)}h
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatTime(job.nextScheduledRun)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatTime(job.lastSuccessfulSync)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Refresh History */}
      {history && history.content.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Refresh History</h3>
            <div className="space-y-3">
              {history.content.map(entry => (
                <div key={entry.orchestrationId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800'
                            : entry.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {entry.targets.join(', ')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started {formatTime(entry.startedAt)} by {entry.requestedBy}
                        {entry.completedAt && (
                          <span> • Completed {formatTime(entry.completedAt)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.totalRecordsProcessed} records
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.executionSource}
                      </div>
                    </div>
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

export default ConnectorRefreshTab;
