import { useState, useEffect, useCallback } from 'react';
// Define types locally to avoid import issues
interface LoginRequest {
  username: string;
  password: string;
}

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
import apiService from '../services/api';
import { USER_DATA_KEY } from '../utils/constants';

interface AuthState extends LoadingState {
  user: User | null;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = () => {
      const token = apiService.getToken();
      const savedUser = localStorage.getItem(USER_DATA_KEY);
      
      if (token && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch {
          // Invalid saved user data, clear it
          apiService.clearToken();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await apiService.login(credentials);
      
      // Store token and user data
      apiService.setToken(response.token);
      const user: User = {
        userId: response.userId,
        username: response.username,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
        tenantId: response.tenantId,
      };
      
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    // Immediately clear frontend state to trigger redirect
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    try {
      // Call backend logout API after state is cleared
      await apiService.logout();
    } catch (error) {
      console.warn('Logout API failed, but frontend cleanup completed:', error);
    }
    
    // Ensure token is cleared
    apiService.clearToken();
    
    // Force redirect as a fallback
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    clearError,
  };
};