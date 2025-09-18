import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useRefresh } from '../../hooks/useRefresh';
import { QuickRefreshModal } from './QuickRefreshModal';
import type { RefreshTarget } from '../../types';

interface ContextualRefreshButtonProps {
  context: string;
  suggestedTargets: RefreshTarget[];
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
}

export const ContextualRefreshButton: React.FC<ContextualRefreshButtonProps> = ({
  context,
  suggestedTargets,
  variant = 'outline',
  size = 'sm',
  className = '',
  label,
}) => {
  const { openModal, modal, closeModal } = useRefresh();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    openModal(context, suggestedTargets);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    closeModal();
  };

  const buttonText = label || `Refresh ${context}`;
  const buttonClass = size === 'sm' 
    ? 'text-sm px-3 py-1.5'
    : 'px-4 py-2';

  return (
    <>
      <Button
        variant={variant}
        onClick={handleOpenModal}
        className={`flex items-center space-x-2 ${buttonClass} ${className}`}
      >
        <Icon name="arrow-path" className="h-4 w-4" />
        <span>{buttonText}</span>
      </Button>

      {/* Quick Refresh Modal */}
      <QuickRefreshModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        context={context}
        preSelectedTargets={suggestedTargets}
      />
    </>
  );
};

export default ContextualRefreshButton;
