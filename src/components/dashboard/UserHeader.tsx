import React from 'react';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import type { User } from '../../types';

interface UserHeaderProps {
  user: User;
  companyName: string;
  onLogout: () => Promise<void>;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  user,
  companyName,
  onLogout,
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and company */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-blue-600">ZenEM</h1>
            <div className="hidden sm:block text-gray-300">|</div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{companyName}</p>
            </div>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => onLogout()}
              className="flex items-center space-x-2"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};