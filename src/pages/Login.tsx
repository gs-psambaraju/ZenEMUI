import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading, error } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <LoginForm onSubmit={login} isLoading={isLoading} error={error} />;
};