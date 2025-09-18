import type { TeammateRole } from '../types';

// Canonical labels for roles used across the UI
export const ROLE_LABELS: Record<TeammateRole, string> = {
  DEVELOPER: 'Developer',
  QA: 'QA Engineer',
  DESIGNER: 'Designer',
  PM: 'Product Manager',
  EM: 'Engineering Manager',
};

// Options helper for selects
export const ROLE_OPTIONS: Array<{ value: TeammateRole; label: string }> = (
  Object.keys(ROLE_LABELS) as TeammateRole[]
).map((key) => ({ value: key, label: ROLE_LABELS[key] }));

// Safe formatter that accepts unknown strings and prettifies when possible
export const getRoleLabel = (role?: string | null): string => {
  if (!role) return '';
  const upper = role.toUpperCase() as TeammateRole;
  return (ROLE_LABELS as Record<string, string>)[upper] || role;
};

// Backend API mapping functions
// Backend expects: "Developer", "QA Engineer", "Designer", "Product Manager", "Engineering Manager"
export const FRONTEND_TO_BACKEND_ROLE: Record<TeammateRole, string> = {
  DEVELOPER: 'Developer',
  QA: 'QA Engineer',
  DESIGNER: 'Designer',
  PM: 'Product Manager',
  EM: 'Engineering Manager',
};

export const BACKEND_TO_FRONTEND_ROLE: Record<string, TeammateRole> = {
  'Developer': 'DEVELOPER',
  'QA Engineer': 'QA',
  'Designer': 'DESIGNER',
  'Product Manager': 'PM',
  'Engineering Manager': 'EM',
};

// Convert frontend role enum to backend API format
export const toBackendRole = (frontendRole: TeammateRole): string => {
  return FRONTEND_TO_BACKEND_ROLE[frontendRole];
};

// Convert backend role string to frontend enum
export const toFrontendRole = (backendRole: string): TeammateRole => {
  return BACKEND_TO_FRONTEND_ROLE[backendRole] || 'DEVELOPER';
};


