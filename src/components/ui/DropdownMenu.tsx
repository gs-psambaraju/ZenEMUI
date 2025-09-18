import React, { useState } from 'react';
import { Icon } from './Icon';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  className?: string;
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Button */}
      <button 
        onClick={handleButtonClick}
        style={{
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon name="ellipsis-vertical" className="h-4 w-4" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
          />
          
          {/* Menu */}
          <div 
            style={{
              position: 'fixed',
              top: buttonRect ? `${buttonRect.bottom + 8}px` : '100%',
              left: buttonRect ? `${buttonRect.right - 200}px` : 'auto',
              zIndex: 9999,
              width: '200px',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  border: 'none',
                  textAlign: 'left',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                  fontSize: '14px',
                  color: '#374151',
                  borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon && (
                    <Icon 
                      name={item.icon as any} 
                      className="h-4 w-4"
                      style={{ marginRight: '12px' }}
                    />
                  )}
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DropdownMenu;
