// Deprecated: use ENV.API_BASE_URL from utils/env.ts instead of API_BASE_URL
// Keeping constant for backwards compatibility; avoid importing in new code.
export const API_BASE_URL = 'http://localhost:8080/api';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ROOT: '/',
  EPICS: '/epics',
  RELEASES: '/releases',
  TEAMS: '/teams',
  TEAMMATES: '/teammates',
  SPRINTS: '/sprints',
  CALENDAR: '/calendar',
  REFRESH_PROGRESS: '/refresh/progress/:orchestrationId',
  ADMIN_CONNECTORS: '/admin/connectors',
  ADMIN_CONNECTOR_DETAIL: '/admin/connectors/:id',
  ADMIN_PLANNING_PERIODS: '/admin/planning-periods',
  ADMIN_OKR_TYPES: '/admin/okr-types',
} as const;

export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'user';

export const TEST_CREDENTIALS = {
  EMAIL: 'admin@default.com',
  USERNAME: 'admin',
  PASSWORD: 'admin123',
} as const;