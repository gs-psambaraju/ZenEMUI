import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import type { 
  RefreshTarget, 
  ConnectionType, 
  RefreshTargetOption, 
  RefreshConnection, 
  RefreshSuggestions, 
  RefreshDependency, 
  RefreshConnectionHealth, 
  StartRefreshResponse, 
  RefreshStatusResponse, 
  ActiveRefreshOperation,
  RefreshEstimateResponse,
  RefreshProgressEvent,
  RefreshValidationResponse
} from '../types';
import { devLog, devError } from '../utils/env';

interface RefreshModalState {
  isOpen: boolean;
  context?: string;
  preSelectedTargets?: RefreshTarget[];
}

interface RefreshSelection {
  targets: RefreshTarget[];
  connectionTypes: ConnectionType[];
  connectionIds: string[];
}

interface RefreshState {
  // Modal state
  modal: RefreshModalState;
  
  // Active operations
  activeOperations: ActiveRefreshOperation[];
  activeBadgeCount: number;
  
  // Selection data
  availableTargets: RefreshTargetOption[];
  availableConnections: RefreshConnection[];
  dependencies: RefreshDependency[];
  connectionHealth: RefreshConnectionHealth[];
  
  // Current selection
  selection: RefreshSelection;
  estimate: RefreshEstimateResponse | null;
  validation: RefreshValidationResponse | null;
  suggestions: RefreshSuggestions | null;
  
  // Progress tracking
  currentRefresh: {
    orchestrationId: string;
    status: RefreshStatusResponse | null;
    eventSource: EventSource | null;
  } | null;
  
  // Loading states
  isLoading: {
    targets: boolean;
    connections: boolean;
    estimate: boolean;
    validation: boolean;
    starting: boolean;
  };
  
  // Error state
  error: string | null;
}

const initialState: RefreshState = {
  modal: { isOpen: false },
  activeOperations: [],
  activeBadgeCount: 0,
  availableTargets: [],
  availableConnections: [],
  dependencies: [],
  connectionHealth: [],
  selection: {
    targets: [],
    connectionTypes: [],
    connectionIds: [],
  },
  estimate: null,
  validation: null,
  suggestions: null,
  currentRefresh: null,
  isLoading: {
    targets: false,
    connections: false,
    estimate: false,
    validation: false,
    starting: false,
  },
  error: null,
};

export function useRefresh() {
  const [state, setState] = useState<RefreshState>(initialState);
  const badgeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const estimateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update active operations badge count
  const updateActiveBadge = useCallback(async () => {
    try {
      const operations = await apiService.getActiveRefreshOperations();
      setState(prev => ({
        ...prev,
        activeOperations: operations,
        activeBadgeCount: operations.length,
      }));
    } catch (error) {
      devError('Failed to update active refresh badge:', error);
    }
  }, []);

  // Start auto-updating badge every 30 seconds
  useEffect(() => {
    // Initial load
    updateActiveBadge();
    
    // Set up interval
    badgeUpdateInterval.current = setInterval(updateActiveBadge, 30000);
    
    return () => {
      if (badgeUpdateInterval.current) {
        clearInterval(badgeUpdateInterval.current);
      }
    };
  }, [updateActiveBadge]);

  // Load available targets and connections when modal opens
  const loadRefreshData = useCallback(async (context?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, targets: true, connections: true },
      error: null,
    }));

    try {
      const [targets, connections, dependencies, health, suggestions] = await Promise.all([
        apiService.getRefreshTargetOptions(),
        apiService.getRefreshConnections(),
        apiService.getRefreshDependencies(),
        apiService.getRefreshConnectionHealth(),
        context ? apiService.getRefreshSuggestions(context) : Promise.resolve(null),
      ]);

      setState(prev => ({
        ...prev,
        availableTargets: targets,
        availableConnections: connections,
        dependencies,
        connectionHealth: health,
        suggestions,
        isLoading: { ...prev.isLoading, targets: false, connections: false },
      }));

      // Auto-select suggested targets if available
      if (suggestions && suggestions.recommendedTargets.length > 0) {
        setState(prev => ({
          ...prev,
          selection: {
            ...prev.selection,
            targets: suggestions.recommendedTargets,
          },
        }));
      }
    } catch (error) {
      devError('Failed to load refresh data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load refresh data',
        isLoading: { ...prev.isLoading, targets: false, connections: false },
      }));
    }
  }, []);

  // Open refresh modal
  const openModal = useCallback((context?: string, preSelectedTargets?: RefreshTarget[]) => {
    setState(prev => ({
      ...prev,
      modal: { isOpen: true, context, preSelectedTargets },
      selection: {
        ...prev.selection,
        targets: preSelectedTargets || [],
      },
    }));
    loadRefreshData(context);
  }, [loadRefreshData]);

  // Close refresh modal
  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      modal: { isOpen: false },
      selection: initialState.selection,
      estimate: null,
      validation: null,
      suggestions: null,
      error: null,
    }));
    
    // Clear estimate timeout
    if (estimateTimeout.current) {
      clearTimeout(estimateTimeout.current);
    }
  }, []);

  // Update selection
  const updateSelection = useCallback((updates: Partial<RefreshSelection>) => {
    setState(prev => {
      const newSelection = { ...prev.selection, ...updates };
      
      // Clear estimate timeout for debouncing
      if (estimateTimeout.current) {
        clearTimeout(estimateTimeout.current);
      }
      
      // Debounce estimate calculation (500ms)
      if (newSelection.targets.length > 0) {
        estimateTimeout.current = setTimeout(async () => {
          try {
            setState(prev => ({
              ...prev,
              isLoading: { ...prev.isLoading, estimate: true },
            }));
            
            const estimate = await apiService.estimateRefresh({
              targets: newSelection.targets,
              connectionTypes: newSelection.connectionTypes.length > 0 ? newSelection.connectionTypes : undefined,
              connectionIds: newSelection.connectionIds.length > 0 ? newSelection.connectionIds : undefined,
            });
            
            setState(prev => ({
              ...prev,
              estimate,
              isLoading: { ...prev.isLoading, estimate: false },
            }));
          } catch (error) {
            devError('Failed to estimate refresh:', error);
            setState(prev => ({
              ...prev,
              isLoading: { ...prev.isLoading, estimate: false },
            }));
          }
        }, 500);
      } else {
        setState(prev => ({
          ...prev,
          estimate: null,
        }));
      }
      
      return {
        ...prev,
        selection: newSelection,
      };
    });
  }, []);

  // Validate refresh before starting
  const validateRefresh = useCallback(async (): Promise<boolean> => {
    if (state.selection.targets.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one target to refresh' }));
      return false;
    }

    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, validation: true },
    }));

    try {
      const validation = await apiService.validateRefresh({
        targets: state.selection.targets,
        connectionTypes: state.selection.connectionTypes.length > 0 ? state.selection.connectionTypes : undefined,
        connectionIds: state.selection.connectionIds.length > 0 ? state.selection.connectionIds : undefined,
      });

      setState(prev => ({
        ...prev,
        validation,
        isLoading: { ...prev.isLoading, validation: false },
      }));

      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          error: validation.errors.join(', '),
        }));
        return false;
      }

      return true;
    } catch (error) {
      devError('Failed to validate refresh:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to validate refresh',
        isLoading: { ...prev.isLoading, validation: false },
      }));
      return false;
    }
  }, [state.selection]);

  // Start refresh operation
  const startRefresh = useCallback(async (): Promise<boolean> => {
    const isValid = await validateRefresh();
    if (!isValid) return false;

    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, starting: true },
    }));

    try {
      const refreshResponse = await apiService.startRefresh({
        targets: state.selection.targets,
        connectionTypes: state.selection.connectionTypes.length > 0 ? state.selection.connectionTypes : undefined,
        connectionIds: state.selection.connectionIds.length > 0 ? state.selection.connectionIds : undefined,
        description: `Manual refresh from ${state.modal.context || 'dashboard'}`,
      });

      // Start monitoring progress
      startProgressMonitoring(refreshResponse.orchestrationId);

      setState(prev => ({
        ...prev,
        isLoading: { ...prev.isLoading, starting: false },
      }));

      // Update active badge immediately
      updateActiveBadge();

      return true;
    } catch (error) {
      devError('Failed to start refresh:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start refresh',
        isLoading: { ...prev.isLoading, starting: false },
      }));
      return false;
    }
  }, [state.selection, state.modal.context, validateRefresh, updateActiveBadge]);

  // Start progress monitoring with SSE and polling fallback
  const startProgressMonitoring = useCallback((orchestrationId: string) => {
    try {
      // Try Server-Sent Events first
      const eventSource = apiService.createRefreshProgressStream(orchestrationId);
      
      eventSource.onmessage = (event) => {
        try {
          const progressEvent: RefreshProgressEvent = JSON.parse(event.data);
          devLog('Received refresh progress event:', progressEvent);
          
          // Update current refresh status based on event
          setState(prev => {
            if (!prev.currentRefresh || prev.currentRefresh.orchestrationId !== orchestrationId) {
              return prev;
            }
            
            // Update status based on event type
            let updatedStatus = prev.currentRefresh.status;
            if (progressEvent.type === 'STATUS_CHANGE' && progressEvent.status && progressEvent.overallProgress !== undefined) {
              updatedStatus = {
                ...updatedStatus,
                status: progressEvent.status,
                overallProgress: progressEvent.overallProgress,
              } as RefreshStatusResponse;
            }
            
            return {
              ...prev,
              currentRefresh: {
                ...prev.currentRefresh,
                status: updatedStatus,
              },
            };
          });
        } catch (error) {
          devError('Failed to parse refresh progress event:', error);
        }
      };

      eventSource.onerror = (error) => {
        devError('SSE connection error, falling back to polling:', error);
        eventSource.close();
        
        // Fall back to polling
        const pollInterval = setInterval(async () => {
          try {
            const status = await apiService.getRefreshStatus(orchestrationId);
            setState(prev => ({
              ...prev,
              currentRefresh: prev.currentRefresh ? {
                ...prev.currentRefresh,
                status,
              } : null,
            }));
            
            // Stop polling if refresh is complete
            if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
              clearInterval(pollInterval);
              updateActiveBadge(); // Update badge when complete
            }
          } catch (error) {
            devError('Failed to poll refresh status:', error);
            clearInterval(pollInterval);
          }
        }, 3000); // Poll every 3 seconds

        // Store interval reference for cleanup
        setState(prev => ({
          ...prev,
          currentRefresh: prev.currentRefresh ? {
            ...prev.currentRefresh,
            eventSource: null,
          } : null,
        }));
      };

      setState(prev => ({
        ...prev,
        currentRefresh: {
          orchestrationId,
          status: null,
          eventSource,
        },
      }));
    } catch (error) {
      devError('Failed to start progress monitoring:', error);
    }
  }, [updateActiveBadge]);

  // Cancel refresh operation
  const cancelRefresh = useCallback(async (orchestrationId: string): Promise<boolean> => {
    try {
      await apiService.cancelRefresh(orchestrationId);
      
      // Clean up progress monitoring
      setState(prev => {
        if (prev.currentRefresh && prev.currentRefresh.orchestrationId === orchestrationId) {
          if (prev.currentRefresh.eventSource) {
            prev.currentRefresh.eventSource.close();
          }
          return {
            ...prev,
            currentRefresh: null,
          };
        }
        return prev;
      });

      updateActiveBadge(); // Update badge after cancellation
      return true;
    } catch (error) {
      devError('Failed to cancel refresh:', error);
      return false;
    }
  }, [updateActiveBadge]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear intervals
      if (badgeUpdateInterval.current) {
        clearInterval(badgeUpdateInterval.current);
      }
      if (estimateTimeout.current) {
        clearTimeout(estimateTimeout.current);
      }
      
      // Close SSE connection
      if (state.currentRefresh && state.currentRefresh.eventSource) {
        state.currentRefresh.eventSource.close();
      }
    };
  }, [state.currentRefresh]);

  return {
    // State
    modal: state.modal,
    activeOperations: state.activeOperations,
    activeBadgeCount: state.activeBadgeCount,
    availableTargets: state.availableTargets,
    availableConnections: state.availableConnections,
    dependencies: state.dependencies,
    connectionHealth: state.connectionHealth,
    selection: state.selection,
    estimate: state.estimate,
    validation: state.validation,
    suggestions: state.suggestions,
    currentRefresh: state.currentRefresh,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    openModal,
    closeModal,
    updateSelection,
    validateRefresh,
    startRefresh,
    cancelRefresh,
    updateActiveBadge,
    startProgressMonitoring,
  };
}

export default useRefresh;
