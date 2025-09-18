import React from 'react';
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WifiIcon,
  SignalSlashIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline';

type IconName =
  | 'eye'
  | 'edit'
  | 'trash'
  | 'arrow-left'
  | 'arrow-right'
  | 'calendar'
  | 'x-mark'
  | 'ellipsis-vertical'
  | 'heart'
  | 'no-symbol'
  | 'arrow-path'
  | 'warning'
  | 'check-circle'
  | 'clock'
  | 'wifi'
  | 'signal-slash'
  | 'play'
  | 'stop';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
}

const iconMap: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  eye: EyeIcon,
  edit: PencilSquareIcon,
  trash: TrashIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  calendar: CalendarDaysIcon,
  'x-mark': XMarkIcon,
  'ellipsis-vertical': EllipsisVerticalIcon,
  heart: HeartIcon,
  'no-symbol': NoSymbolIcon,
  'arrow-path': ArrowPathIcon,
  warning: ExclamationTriangleIcon,
  'check-circle': CheckCircleIcon,
  clock: ClockIcon,
  wifi: WifiIcon,
  'signal-slash': SignalSlashIcon,
  play: PlayIcon,
  stop: StopIcon,
};

export const Icon: React.FC<IconProps> = ({ name, className = 'h-5 w-5', ...rest }) => {
  const Cmp = iconMap[name];
  if (!Cmp) return null;
  return <Cmp className={className} {...rest} />;
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  variant?: 'default' | 'ghost' | 'danger';
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, variant = 'default', title, className = '', ...rest }) => {
  const base = 'inline-flex items-center justify-center rounded-md border transition-colors';
  const styles = {
    default: 'h-8 w-8 border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'h-8 w-8 border-transparent text-gray-600 hover:bg-gray-100',
    danger: 'h-8 w-8 border-red-300 text-red-600 hover:bg-red-50',
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} aria-label={title} title={title} {...rest}>
      <Icon name={icon} />
    </button>
  );
};

export default Icon;


