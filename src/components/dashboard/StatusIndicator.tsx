import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { OnboardingStatusType } from '../../types';

interface StatusIndicatorProps {
  status: OnboardingStatusType;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  className = '',
}) => {
  const getStatusConfig = (status: OnboardingStatusType) => {
    switch (status) {
      case 'FULLY_ONBOARDED':
      case 'COMPLETED':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: status === 'COMPLETED' ? 'Setup Complete' : 'Fully Onboarded',
          description: 'All purchased outcomes have been configured',
        };
      case 'PARTIALLY_ONBOARDED':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Partially Onboarded',
          description: 'Some outcomes are configured, others are available',
        };
      case 'NOT_ONBOARDED':
      default:
        return {
          icon: XCircleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Not Onboarded',
          description: 'No outcomes have been configured',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`flex-shrink-0 w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${config.color}`} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
        <p className="text-sm text-gray-600">{config.description}</p>
      </div>
    </div>
  );
};