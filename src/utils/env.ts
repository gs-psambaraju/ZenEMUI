// Environment configuration utilities

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Development helpers
export const isDev = () => ENV.IS_DEVELOPMENT;
export const isProd = () => ENV.IS_PRODUCTION;

// API URL helper
export const getApiUrl = (endpoint: string) => {
  const baseUrl = ENV.API_BASE_URL.endsWith('/') 
    ? ENV.API_BASE_URL.slice(0, -1) 
    : ENV.API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Development logging
export const devLog = (...args: any[]) => {
  if (isDev()) {
    console.log('[DEV]', ...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDev()) {
    console.warn('[DEV]', ...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDev()) {
    console.error('[DEV]', ...args);
  }
};