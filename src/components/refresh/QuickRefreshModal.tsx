import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MultiSelect } from '../ui/MultiSelect';
import { Icon } from '../ui/Icon';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useRefresh } from '../../hooks/useRefresh';
import type { RefreshTarget, ConnectionType, RefreshTargetOption, RefreshConnection } from '../../types';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface QuickRefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  preSelectedTargets?: RefreshTarget[];
}

interface TargetCategoryGroup {
  name: string;
  targets: RefreshTargetOption[];
}

export const QuickRefreshModal: React.FC<QuickRefreshModalProps> = ({
  isOpen,
  onClose,
  context,
  preSelectedTargets,
}) => {
  const {
    availableTargets,
    availableConnections,
    dependencies,
    connectionHealth,
    selection,
    estimate,
    validation,
    suggestions,
    currentRefresh,
    isLoading,
    error,
    updateSelection,
    startRefresh,
  } = useRefresh();

  const [step, setStep] = useState<'selection' | 'progress'>('selection');

  // Group targets by category
  const targetCategories: TargetCategoryGroup[] = useMemo(() => {
    const categoryMap = new Map<string, RefreshTargetOption[]>();
    
    availableTargets.forEach(target => {
      const category = target.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(target);
    });

    return Array.from(categoryMap.entries()).map(([name, targets]) => ({
      name,
      targets: targets.sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [availableTargets]);

  // Convert targets to MultiSelect options
  const targetOptions: MultiSelectOption[] = useMemo(() => {
    return availableTargets.map(target => ({
      value: target.value,
      label: target.label,
    }));
  }, [availableTargets]);

  // Convert connections to MultiSelect options
  const connectionOptions: MultiSelectOption[] = useMemo(() => {
    return availableConnections.map(connection => ({
      value: connection.id,
      label: `${connection.name} (${connection.type})`,
    }));
  }, [availableConnections]);

  // Get healthy connections
  const healthyConnections = useMemo(() => {
    return connectionHealth.filter(conn => conn.healthStatus === 'HEALTHY');
  }, [connectionHealth]);

  // Get unhealthy connections
  const unhealthyConnections = useMemo(() => {
    return connectionHealth.filter(conn => conn.healthStatus !== 'HEALTHY');
  }, [connectionHealth]);

  // Get dependencies for selected targets
  const selectedDependencies = useMemo(() => {
    const selectedTargetSet = new Set(selection.targets);
    return dependencies.filter(dep => selectedTargetSet.has(dep.target));
  }, [dependencies, selection.targets]);

  // Handle target selection
  const handleTargetChange = (selectedValues: string[]) => {
    updateSelection({
      targets: selectedValues as RefreshTarget[],
    });
  };

  // Handle connection selection
  const handleConnectionChange = (selectedValues: string[]) => {
    updateSelection({
      connectionIds: selectedValues,
    });
  };

  // Handle start refresh
  const handleStartRefresh = async () => {
    const success = await startRefresh();
    if (success) {
      setStep('progress');
    }
  };

  // Reset step when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('selection');
    }
  }, [isOpen]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Get connection health status color
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600';
      case 'WARNING': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  // Get connection health icon
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'check-circle';
      case 'WARNING': return 'warning';
      default: return 'signal-slash';
    }
  };

  const renderSelectionStep = () => (
    <div className="space-y-6">
      {/* Smart Suggestions */}
      {suggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            <Icon name="check-circle" className="h-4 w-4 inline mr-1" />
            Recommended for {context || 'current page'}
          </h4>
          {suggestions.recommendedTargets.length > 0 && (
            <div className="text-sm text-blue-700">
              Suggested: {suggestions.recommendedTargets.join(', ')}
            </div>
          )}
          {suggestions.warnings.length > 0 && (
            <div className="text-sm text-yellow-700 mt-1">
              {suggestions.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-1">
                  <Icon name="warning" className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Target Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data to Refresh
        </label>
        <MultiSelect
          options={targetOptions}
          value={selection.targets}
          onChange={handleTargetChange}
          placeholder="Select data types to refresh..."
          className="w-full"
        />
        
        {/* Target Categories Display */}
        {targetCategories.length > 0 && selection.targets.length === 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {targetCategories.map(category => (
              <div key={category.name} className="bg-gray-50 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-700 mb-1">{category.name}</h5>
                <div className="text-xs text-gray-500 space-y-0.5">
                  {category.targets.slice(0, 3).map(target => (
                    <div key={target.value} className="flex items-center gap-1">
                      {target.recommended && <Icon name="check-circle" className="h-3 w-3 text-green-500" />}
                      {target.label}
                    </div>
                  ))}
                  {category.targets.length > 3 && (
                    <div className="text-gray-400">+{category.targets.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Selection */}
      {availableConnections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Sources (Optional)
          </label>
          <MultiSelect
            options={connectionOptions}
            value={selection.connectionIds}
            onChange={handleConnectionChange}
            placeholder="Select specific connections or leave empty for all..."
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to refresh from all available connections
          </p>
        </div>
      )}

      {/* Connection Health Status */}
      {connectionHealth.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Connection Health</h4>
          <div className="space-y-2">
            {healthyConnections.length > 0 && (
              <div className="text-sm">
                <span className="text-green-600 font-medium">{healthyConnections.length} healthy</span>
                <div className="mt-1 space-y-1">
                  {healthyConnections.map(conn => (
                    <div key={conn.connectionId} className="flex items-center gap-2 text-xs text-gray-600">
                      <Icon name={getHealthIcon(conn.healthStatus)} className={`h-3 w-3 ${getHealthColor(conn.healthStatus)}`} />
                      {conn.connectionName} ({conn.connectionType})
                    </div>
                  ))}
                </div>
              </div>
            )}
            {unhealthyConnections.length > 0 && (
              <div className="text-sm">
                <span className="text-red-600 font-medium">{unhealthyConnections.length} with issues</span>
                <div className="mt-1 space-y-1">
                  {unhealthyConnections.map(conn => (
                    <div key={conn.connectionId} className="flex items-center gap-2 text-xs text-red-600">
                      <Icon name={getHealthIcon(conn.healthStatus)} className={`h-3 w-3 ${getHealthColor(conn.healthStatus)}`} />
                      {conn.connectionName} ({conn.connectionType})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dependencies Warning */}
      {selectedDependencies.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            <Icon name="warning" className="h-4 w-4 inline mr-1" />
            Additional Data Will Be Refreshed
          </h4>
          <div className="text-sm text-yellow-700 space-y-1">
            {selectedDependencies.map(dep => (
              <div key={dep.target}>
                {dep.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Estimate */}
      {estimate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="clock" className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Estimated Time: {formatDuration(estimate.estimatedDurationSeconds)}
              </span>
            </div>
            <span className="text-xs text-blue-600">
              ~{estimate.estimatedRecords} records
            </span>
          </div>
          {estimate.warnings.length > 0 && (
            <div className="mt-2 text-xs text-yellow-700">
              {estimate.warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {validation && !validation.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            <Icon name="warning" className="h-4 w-4 inline mr-1" />
            Issues Found
          </h4>
          <div className="text-sm text-red-700 space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* General Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <Icon name="warning" className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}
    </div>
  );

  const renderProgressStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4">
          <LoadingSpinner size="lg" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Refreshing Data
        </h3>
        {currentRefresh && currentRefresh.status && (
          <div className="space-y-4">
            <div className="bg-gray-200 rounded-full h-2 w-full">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentRefresh.status.overallProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              {currentRefresh.status.overallProgress}% complete
              {currentRefresh.status.estimatedCompletionSeconds > 0 && (
                <span className="ml-2">
                  (~{formatDuration(currentRefresh.status.estimatedCompletionSeconds)} remaining)
                </span>
              )}
            </div>
            
            {/* Per-target progress */}
            {currentRefresh.status.targets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Progress by Target</h4>
                {currentRefresh.status.targets.map(target => (
                  <div key={target.target} className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{target.target}</span>
                      <span className="text-xs text-gray-500">
                        {target.status === 'COMPLETED' ? (
                          <Icon name="check-circle" className="h-4 w-4 text-green-600" />
                        ) : target.status === 'IN_PROGRESS' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <span className="text-gray-400">Waiting...</span>
                        )}
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${target.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {target.connectionName} ({target.connectionType})
                      </span>
                      <span className="text-xs text-gray-500">
                        {target.recordsProcessed} / {target.recordsTotal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const getFooter = () => {
    if (step === 'progress') {
      return (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Run in Background
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Implement cancel functionality
              console.log('Cancel refresh');
            }}
          >
            <Icon name="stop" className="h-4 w-4 mr-1" />
            Cancel Refresh
          </Button>
        </div>
      );
    }

    return (
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleStartRefresh}
          disabled={selection.targets.length === 0 || isLoading.starting}
          isLoading={isLoading.starting}
        >
          <Icon name="play" className="h-4 w-4 mr-1" />
          Start Refresh
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'selection' ? 'Refresh Data' : 'Refresh in Progress'}
      size="large"
      footer={getFooter()}
    >
      {isLoading.targets || isLoading.connections ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading refresh options...</span>
        </div>
      ) : step === 'selection' ? (
        renderSelectionStep()
      ) : (
        renderProgressStep()
      )}
    </Modal>
  );
};

export default QuickRefreshModal;
