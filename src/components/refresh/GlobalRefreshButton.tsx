import React, { useState } from 'react';
import { IconButton } from '../ui/Icon';
import { useRefresh } from '../../hooks/useRefresh';
import { QuickRefreshModal } from './QuickRefreshModal';

interface GlobalRefreshButtonProps {
  className?: string;
}

export const GlobalRefreshButton: React.FC<GlobalRefreshButtonProps> = ({ 
  className = '' 
}) => {
  const { activeBadgeCount, openModal, modal, closeModal } = useRefresh();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    openModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    closeModal();
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <IconButton
          icon="arrow-path"
          variant="default"
          title="Refresh Data"
          onClick={handleOpenModal}
          className="relative"
        />
        
        {/* Badge indicator for active refreshes */}
        {activeBadgeCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium border-2 border-white">
            {activeBadgeCount > 9 ? '9+' : activeBadgeCount}
          </div>
        )}
      </div>

      {/* Quick Refresh Modal */}
      <QuickRefreshModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        context="dashboard"
      />
    </>
  );
};

export default GlobalRefreshButton;
