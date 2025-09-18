import React from 'react';
import { ClockIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { NextAction } from '../../types';

interface NextActionsProps {
  actions: NextAction[];
}

export const NextActions: React.FC<NextActionsProps> = ({ actions }) => {
  const getPriorityColor = (priority: NextAction['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (actions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recommended actions at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Recommended Next Steps</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {action.title}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(action.priority)}`}>
                    {action.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{action.estimatedTime}</span>
                </div>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};