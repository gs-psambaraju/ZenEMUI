import React from 'react';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'large';
  // Optional content to render next to the title (e.g., a stepper)
  headerExtras?: React.ReactNode;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  // Full-screen wizard modal width
  xl: 'max-w-5xl',
  large: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({ open, isOpen, onClose, title, children, footer, size = 'lg', headerExtras }) => {
  const modalOpen = open ?? isOpen ?? false;
  if (!modalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`relative bg-white rounded-xl shadow-xl w-full ${sizeMap[size]} mx-4 ${size === 'xl' ? 'h-[88vh] flex flex-col' : ''}`}>
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center gap-4 min-w-0">
            <h3 id="modal-title" className="text-xl font-semibold text-gray-900 whitespace-nowrap">{title}</h3>
            {headerExtras && (
              <div className="hidden md:block min-w-0 flex-1 truncate">{headerExtras}</div>
            )}
          </div>
          <button aria-label="Close" onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className={`${size === 'xl' ? 'px-6 py-5 flex-1 overflow-auto' : 'px-6 py-5 max-h-[66vh] overflow-auto'}`}>{children}</div>
        {footer && <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl sticky bottom-0">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;


