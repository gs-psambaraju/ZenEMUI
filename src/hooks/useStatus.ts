import { useState, useEffect, useCallback } from 'react';
import type { LoadingState } from '../types';

import type { HomeDashboardResponse } from '../services/api';
import apiService from '../services/api';

interface StatusState extends LoadingState {
  statusData: HomeDashboardResponse | null;
}

export const useStatus = (isAuthenticated: boolean) => {
  const [statusState, setStatusState] = useState<StatusState>({
    statusData: null,
    isLoading: false,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;

    setStatusState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await apiService.getHomeDashboard();
      setStatusState({
        statusData: response,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch status';
      setStatusState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const refetch = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...statusState,
    refetch,
  };
};