import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

// See: https://env.t3.gg/docs/core
export const env = createEnv({
  server: {
    // See explanations for each variable in `/services/.env.example`
    // This file follows the same order/structure.

    // Environment/Instance specifics
    ENV_NAME: z.string().optional(),
    ENV_ICON: z.url().or(z.string().startsWith('data:')).optional(),
    NODE_ENV: z.enum(['test', 'production', 'development']),
    GLOBAL_121_VERSION: z.string().optional(),

    // API set up
    PORT_121_SERVICE: z.coerce.number(),
    PORT_MOCK_SERVICE: z.coerce.number(),

    EXTERNAL_121_SERVICE_URL: z.url().endsWith('/'),

    GENERIC_THROTTLING_TTL: z.coerce.number().optional(),
    GENERIC_THROTTLING_LIMIT: z.coerce.number().optional(),
    HIGH_THROTTLING_TTL: z.coerce.number().optional(),
    HIGH_THROTTLING_LIMIT: z.coerce.number().optional(),

    // Database
    POSTGRES_HOST: z.string(),
    POSTGRES_PORT: z.coerce.number(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DBNAME: z.string(),

    // Queue/Redis
    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_PREFIX: z.string().optional(),

    // Data management
    RESET_SECRET: z.string().min(8),
    SECRETS_121_SERVICE_SECRET: z.string().min(8),
    UUID_NAMESPACE: z.uuidv4().optional(),

    // Access management
    USE_SSO_AZURE_ENTRA: z.stringbool().default(false),
    AZURE_ENTRA_CLIENT_ID: z.string().optional(),

    // Default User-accounts
    USERCONFIG_121_SERVICE_EMAIL_ADMIN: z.email(),
    USERCONFIG_121_SERVICE_PASSWORD_ADMIN: z.string(),

    USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN: z.string().optional(),

    USERCONFIG_121_SERVICE_EMAIL_USER_VIEW: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW: z.string().optional(),

    USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_REGISTRATION: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_REGISTRATION: z
      .string()
      .optional(),

    USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_VALIDATION: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_VALIDATION: z.string().optional(),

    USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER: z.string().optional(),

    USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER: z.string().optional(),

    USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER: z.string().optional(),

    USERCONFIG_121_SERVICE_EMAIL_FINANCE_OFFICER: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_FINANCE_OFFICER: z.string().optional(),

    USERCONFIG_121_SERVICE_EMAIL_VIEW_WITHOUT_PII: z.email().optional(),
    USERCONFIG_121_SERVICE_PASSWORD_VIEW_WITHOUT_PII: z.string().optional(),

    // Scheduled(cron) Activities
    CRON_GET_DAILY_EXCHANGE_RATES: z.stringbool().default(false),
    CRON_INTERSOLVE_VOUCHER_CANCEL_FAILED_CARDS: z.stringbool().default(false),
    CRON_INTERSOLVE_VOUCHER_CACHE_UNUSED_VOUCHERS: z
      .stringbool()
      .default(false),
    CRON_INTERSOLVE_VOUCHER_SEND_WHATSAPP_REMINDERS: z
      .stringbool()
      .default(false),
    CRON_INTERSOLVE_VOUCHER_REMOVE_DEPRECATED_IMAGE_CODES: z
      .stringbool()
      .default(false),
    CRON_INTERSOLVE_VISA_UPDATE_WALLET_DETAILS: z.stringbool().default(false),
    CRON_CBE_ACCOUNT_ENQUIRIES_VALIDATION: z.stringbool().default(false),
    CRON_NEDBANK_VOUCHERS: z.stringbool().default(false),

    // Interface(s) configuration
    REDIRECT_PORTAL_URL_HOST: z
      .url()
      .refine((value) => !value.endsWith('/'))
      .optional(),

    // Third-party: Azure ApplicationInsights
    APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),

    // Third-party: Azure Email Service
    AZURE_EMAIL_API_URL: z.string().optional(),

    // Third-party: Mock/testing
    MOCK_SERVICE_URL: z.url().endsWith('/'),
    MOCK_DAILY_EXCHANGE_RATES: z.stringbool().default(false),

    // Third-party: Twilio
    TWILIO_SID: z.string(),
    TWILIO_AUTHTOKEN: z.string(),
    TWILIO_WHATSAPP_NUMBER: z.string().min(10).regex(/\d+/),
    TWILIO_MESSAGING_SID: z.string(),
    MOCK_TWILIO: z.stringbool().default(false),

    // Third-party: Kobo Connect
    KOBO_CONNECT_API_URL: z.url().refine((value) => !value.endsWith('/')),

    // FSP-specific configuration:
    INTERSOLVE_VISA_ASSET_CODE: z.string().default(''),
  },

  // We don't use client-side env variables in the same way as in the services
  clientPrefix: '',
  client: {},

  // eslint-disable-next-line n/no-process-env -- We need to give access to the actual values (at leas once)
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
