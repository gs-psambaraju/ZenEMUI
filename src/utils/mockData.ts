import type { LoginResponse, StatusResponse, OnboardingStatusType } from '../types';

// Mock user data for development
export const mockLoginResponse: LoginResponse = {
  token: 'mock-jwt-token-for-development',
  userId: 'default-admin',
  username: 'admin',
  email: 'admin@default.com',
  fullName: 'System Administrator',
  role: 'PLATFORM_ADMIN',
  tenantId: 'default-tenant',
};

// Mock status responses for different onboarding states
export const createMockStatusResponse = (
  status: OnboardingStatusType = 'PARTIALLY_ONBOARDED'
): StatusResponse => {
  const baseResponse: StatusResponse = {
    user: {
      userId: mockLoginResponse.userId,
      username: mockLoginResponse.username,
      email: mockLoginResponse.email,
      fullName: mockLoginResponse.fullName,
      role: mockLoginResponse.role,
      tenantId: mockLoginResponse.tenantId,
    },
    company: {
      name: 'Default Company',
      tenantId: 'default-tenant',
    },
    onboardingStatus: {
      status,
      description: '',
      nextActions: [],
    },
  };

  // Customize based on status
  switch (status) {
    case 'NOT_ONBOARDED':
      baseResponse.onboardingStatus = {
        status,
        description: 'No outcomes have been configured',
        nextActions: [
          {
            id: 'setup-project-management',
            title: 'Setup Project Management',
            description: 'Configure your first project management outcome to start organizing work.',
            estimatedTime: '5-10 minutes',
            priority: 'high',
          },
          {
            id: 'configure-team-structure',
            title: 'Configure Team Structure',
            description: 'Define teams and roles for your organization.',
            estimatedTime: '10-15 minutes',
            priority: 'high',
          },
          {
            id: 'setup-integrations',
            title: 'Setup Integrations',
            description: 'Connect your existing tools and systems.',
            estimatedTime: '15-20 minutes',
            priority: 'medium',
          },
        ],
      };
      break;

    case 'PARTIALLY_ONBOARDED':
      baseResponse.onboardingStatus = {
        status,
        description: 'Some outcomes are configured, others are available',
        nextActions: [
          {
            id: 'complete-analytics-setup',
            title: 'Complete Analytics Setup',
            description: 'Finish configuring your analytics and reporting capabilities.',
            estimatedTime: '8-12 minutes',
            priority: 'medium',
          },
          {
            id: 'setup-notifications',
            title: 'Setup Notifications',
            description: 'Configure alerts and notification preferences.',
            estimatedTime: '5-8 minutes',
            priority: 'low',
          },
        ],
      };
      break;

    case 'FULLY_ONBOARDED':
      baseResponse.onboardingStatus = {
        status,
        description: 'All purchased outcomes have been configured',
        nextActions: [
          {
            id: 'explore-advanced-features',
            title: 'Explore Advanced Features',
            description: 'Discover additional capabilities to optimize your workflow.',
            estimatedTime: '10-15 minutes',
            priority: 'low',
          },
        ],
      };
      break;
  }

  return baseResponse;
};

// Development mode detection
export const isDevelopmentMode = () => {
  return import.meta.env.DEV;
};

// Mock API delay for realistic development experience
export const mockDelay = (ms: number = 800) => 
  new Promise(resolve => setTimeout(resolve, ms));