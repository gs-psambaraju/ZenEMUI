import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
}

const accentMap: Record<NonNullable<KpiCardProps['accent']>, { ring: string; text: string }> = {
  blue: { ring: 'ring-blue-200', text: 'text-blue-700' },
  green: { ring: 'ring-green-200', text: 'text-green-700' },
  amber: { ring: 'ring-amber-200', text: 'text-amber-700' },
  red: { ring: 'ring-red-200', text: 'text-red-700' },
  gray: { ring: 'ring-gray-200', text: 'text-gray-700' },
};

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, accent = 'gray' }) => {
  const colors = accentMap[accent];
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ring-1 ${colors.ring}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${colors.text}`}>{value}</p>
    </div>
  );
};

export default KpiCard;


