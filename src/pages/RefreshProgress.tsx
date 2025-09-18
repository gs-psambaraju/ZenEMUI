import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Card } from '../components/ui/Card';
import { useRefresh } from '../hooks/useRefresh';
import { apiService } from '../services/api';
import type { RefreshStatusResponse, RefreshError } from '../types';

interface RefreshProgressProps {
  // Optional orchestrationId prop for embedded usage
  orchestrationId?: string;
}

export const RefreshProgress: React.FC<RefreshProgressProps> = ({
  orchestrationId: propOrchestrationId
}) => {
  const { orchestrationId: paramOrchestrationId } = useParams<{ orchestrationId: string }>();
  const orchestrationId = propOrchestrationId || paramOrchestrationId;
  const navigate = useNavigate();
  
  const { cancelRefresh, startProgressMonitoring } = useRefresh();
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load initial status and set up monitoring
  useEffect(() => {
    if (!orchestrationId) return;

    const loadStatus = async () => {
      try {
        setIsLoading(true);
        const status = await apiService.getRefreshStatus(orchestrationId);
        setRefreshStatus(status);
        
        // Start real-time monitoring if still in progress
        if (status.status === 'IN_PROGRESS') {
          startProgressMonitoring(orchestrationId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load refresh status');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [orchestrationId, startProgressMonitoring]);

  // Handle cancel refresh
  const handleCancel = async () => {
    if (!orchestrationId) return;
    
    setIsCancelling(true);
    try {
      const success = await cancelRefresh(orchestrationId);
      if (success) {
        // Refresh status to show cancellation
        const status = await apiService.getRefreshStatus(orchestrationId);
        setRefreshStatus(status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel refresh');
    } finally {
      setIsCancelling(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'IN_PROGRESS': return 'text-blue-600';
      case 'FAILED': return 'text-red-600';
      case 'CANCELLED': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'check-circle';
      case 'IN_PROGRESS': return 'arrow-path';
      case 'FAILED': return 'warning';
      case 'CANCELLED': return 'stop';
      default: return 'clock';
    }
  };

  if (!orchestrationId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-8">
          <Icon name="warning" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Refresh Operation Specified</h2>
          <p className="text-gray-600 mb-4">Please provide a valid refresh operation ID.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-8">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Loading refresh status...</h2>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-8">
          <Icon name="warning" className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error Loading Refresh Status</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!refreshStatus) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-8">
          <Icon name="warning" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Refresh Operation Not Found</h2>
          <p className="text-gray-600 mb-4">The requested refresh operation could not be found.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refresh Progress</h1>
          <p className="text-gray-600">Operation ID: {orchestrationId}</p>
        </div>
        <div className="flex items-center space-x-3">
          {refreshStatus.status === 'IN_PROGRESS' && (
            <Button
              variant="outline"
              onClick={handleCancel}
              isLoading={isCancelling}
              className="flex items-center space-x-2"
            >
              <Icon name="stop" className="h-4 w-4" />
              <span>Cancel Refresh</span>
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Icon 
                name={getStatusIcon(refreshStatus.status)} 
                className={`h-8 w-8 ${getStatusColor(refreshStatus.status)} ${refreshStatus.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} 
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {refreshStatus.status.replace('_', ' ')}
                </h2>
                <p className="text-gray-600">Started at {formatTime(refreshStatus.startedAt)}</p>
                {refreshStatus.completedAt && (
                  <p className="text-gray-600">Completed at {formatTime(refreshStatus.completedAt)}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {refreshStatus.overallProgress}%
              </div>
              <div className="text-sm text-gray-500">
                {refreshStatus.estimatedCompletionSeconds > 0 && refreshStatus.status === 'IN_PROGRESS' && (
                  <>~{formatDuration(refreshStatus.estimatedCompletionSeconds)} remaining</>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  refreshStatus.status === 'COMPLETED' 
                    ? 'bg-green-600' 
                    : refreshStatus.status === 'FAILED' 
                    ? 'bg-red-600' 
                    : 'bg-blue-600'
                }`}
                style={{ width: `${refreshStatus.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Warnings */}
          {refreshStatus.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Icon name="warning" className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Warnings</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {refreshStatus.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Per-Target Progress */}
      {refreshStatus.targets.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Progress</h3>
            <div className="space-y-4">
              {refreshStatus.targets.map((target) => (
                <div key={target.target} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Icon
                        name={getStatusIcon(target.status)}
                        className={`h-5 w-5 ${getStatusColor(target.status)} ${target.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{target.target}</h4>
                        <p className="text-sm text-gray-600">
                          {target.connectionName} ({target.connectionType})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {target.progress}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {target.recordsProcessed} / {target.recordsTotal} records
                      </div>
                      {target.completedAt && (
                        <div className="text-xs text-gray-400">
                          Completed {formatTime(target.completedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Target Progress Bar */}
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        target.status === 'COMPLETED' 
                          ? 'bg-green-500' 
                          : target.status === 'FAILED' 
                          ? 'bg-red-500' 
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${target.progress}%` }}
                    />
                  </div>

                  {/* Target Errors */}
                  {target.errors && target.errors.length > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                      <h5 className="text-sm font-medium text-red-800 mb-1">Errors</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {target.errors.map((error, index) => (
                          <li key={index}>{error.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Overall Errors */}
      {refreshStatus.errors.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center space-x-2">
              <Icon name="warning" className="h-5 w-5" />
              <span>Errors</span>
            </h3>
            <div className="space-y-3">
              {refreshStatus.errors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Icon name="warning" className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">{error.code}</h4>
                      <p className="text-red-700 mt-1">{error.message}</p>
                      {(error.target || error.connectionName) && (
                        <div className="text-sm text-red-600 mt-2">
                          {error.target && <span>Target: {error.target}</span>}
                          {error.target && error.connectionName && <span> • </span>}
                          {error.connectionName && <span>Connection: {error.connectionName}</span>}
                        </div>
                      )}
                      {error.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-red-600 cursor-pointer hover:text-red-800">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(error.details, null, 2)}
                          </pre>
                        </details>
                      )}
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

export default RefreshProgress;
