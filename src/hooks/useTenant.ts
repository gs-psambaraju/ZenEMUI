import { useCallback, useEffect, useState } from 'react';
import apiService from '../services/api';

interface TenantState {
  tenantName: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useTenant = () => {
  const [state, setState] = useState<TenantState>({ tenantName: null, isLoading: false, error: null });

  const fetchTenant = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Reuse existing status endpoint that includes tenantName
      const status = await apiService.getStatus();
      const name = (status as any)?.tenantName ?? null;
      setState({ tenantName: name, isLoading: false, error: null });
    } catch (e) {
      setState({ tenantName: null, isLoading: false, error: e instanceof Error ? e.message : 'Failed to load tenant' });
    }
  }, []);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  return { ...state, refetch: fetchTenant };
};


