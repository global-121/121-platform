import { env } from '@121-service/src/env';

export interface PerformanceTestConfig {
  baseUrl: string;
  credentials: {
    username: string;
    password: string;
  };
  timeouts: {
    default: number;
    import: number;
    payment: number;
  };
}

export const performanceConfig: PerformanceTestConfig = {
  baseUrl: env.EXTERNAL_121_SERVICE_URL
    ? env.EXTERNAL_121_SERVICE_URL.replace(/\/+$/, '') + '/api'
    : 'http://localhost:3000/api',
  credentials: {
    username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN || 'admin@example.org',
    password: env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN || 'password',
  },
  timeouts: {
    default: 30000, // 30 seconds
    import: 1200000, // 20 minutes for large imports
    payment: 4800000, // 80 minutes for large payments
  },
};

// Environment variable helpers (replacing K6 __ENV)
export function getEnvironmentValue(key: string, defaultValue = ''): string {
  // eslint-disable-next-line n/no-process-env
  return process.env[key] || defaultValue;
}

export function getEnvironmentNumber(key: string, defaultValue = 0): number {
  // eslint-disable-next-line n/no-process-env
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}
