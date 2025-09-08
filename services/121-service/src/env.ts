import { createEnv } from '@t3-oss/env-core';
import { withoutLeadingSlash, withoutTrailingSlash } from 'ufo';
import { v4 as createUuid } from 'uuid';
import { z } from 'zod/v4';

// See: https://env.t3.gg/docs/core
export const env = createEnv({
  // eslint-disable-next-line n/no-process-env -- We need to give access to the actual values (at least once)
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,

  /**
   * See explanations for each variable in `services/.env.example`
   * This file follows the same order/structure.
   *
   * Guidelines:
   * - Use as many _specific_ requirements as possible, like `.min(8)`, `.email()`, `.url()`, etc.
   *   See, for built-in possibilities: https://zod.dev/api
   *
   * - Use `.optional()` if the service should be able to start-up without any value set.
   *   This applies to non-critical features, but also for ANY FSP-related variables!
   *   ANY FSP should be considered "only optional", so that each instance of the platform ONLY has to set the FSP-related values that are in use.
   *
   * - Use `.default(value)` ONLY if there is a safe, generic value available that can be used in production.
   *
   * - If a valid/unique value IS required for the service to start-up,
   *   or MUST be set to run all (API/E2E-)tests,
   *   _only then_ commit a hard-coded (development/test-only) value in `.env.example`, do not use `.default()`.
   *
   */
  server: {
    // Environment/Instance specifics
    ENV_NAME: z.string().optional(),
    ENV_ICON: z.url().or(z.string().startsWith('data:')).optional(),
    NODE_ENV: z.enum(['test', 'production', 'development']),
    GLOBAL_121_VERSION: z.string().optional(),

    // API set up
    PORT_121_SERVICE: z.coerce.number().default(8080),
    PORT_MOCK_SERVICE: z.coerce.number().optional(),

    EXTERNAL_121_SERVICE_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url))),

    GENERIC_THROTTLING_LIMIT: z.coerce.number().optional().default(3_000),
    GENERIC_THROTTLING_TTL: z.coerce.number().optional().default(60),
    HIGH_THROTTLING_LIMIT: z.coerce.number().optional().default(30),
    HIGH_THROTTLING_TTL: z.coerce.number().optional().default(60),

    // Database
    POSTGRES_HOST: z.string().default('121db'),
    POSTGRES_PORT: z.coerce.number().default(5432),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DBNAME: z.string(),

    // Queue/Redis
    REDIS_HOST: z.string().default('121-redis'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_PREFIX: z
      .string()
      .regex(/[\w.-]*/)
      .default('dev_'),

    // Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: z.string(),
    AZURE_STORAGE_CONTAINER_NAME: z
      .string()
      .lowercase()
      .min(3)
      .max(63)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

    // Data management
    RESET_SECRET: z.string().min(8),
    SECRETS_121_SERVICE_SECRET: z.string().min(8),
    UUID_NAMESPACE: z.uuidv4().optional().default(createUuid()),

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
    CRON_ONAFRIQ_RECONCILIATION_REPORT: z.stringbool().default(false),

    // Interface(s) configuration
    REDIRECT_PORTAL_URL_HOST: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url))),

    // Third-party: Azure ApplicationInsights
    APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),

    // Third-party: Azure Email Service
    AZURE_EMAIL_API_URL: z.url(),

    // Third-party: Mock/testing
    MOCK_SERVICE_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url))),
    MOCK_DAILY_EXCHANGE_RATES: z.stringbool().default(false),

    // Third-party: Twilio
    MOCK_TWILIO: z.stringbool().default(false),
    TWILIO_SID: z.string().startsWith('AC'),
    TWILIO_AUTHTOKEN: z.string(),
    TWILIO_WHATSAPP_NUMBER: z.string().min(10).regex(/\d+/),
    TWILIO_MESSAGING_SID: z.string().startsWith('MG'),

    // Third-party: Kobo Connect
    KOBO_CONNECT_API_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url))),

    // FSP-specific configuration(s):

    // FSP: Intersolve
    MOCK_INTERSOLVE: z.stringbool().default(false),
    // FSP: Intersolve - Voucher
    INTERSOLVE_EAN: z.string().default(''),
    INTERSOLVE_URL: z.url().default(''),
    // FSP: Intersolve - Visa
    INTERSOLVE_VISA_CLIENT_ID: z.string().default(''),
    INTERSOLVE_VISA_CLIENT_SECRET: z.string().optional(),
    INTERSOLVE_VISA_TENANT_ID: z.string().optional(),
    INTERSOLVE_VISA_PROD: z.stringbool().default(false),
    INTERSOLVE_VISA_API_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url)))
      .optional(),
    INTERSOLVE_VISA_OIDC_ISSUER: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url)))
      .optional(),
    INTERSOLVE_VISA_ASSET_CODE: z.string().default(''),
    INTERSOLVE_VISA_SEND_UPDATED_CONTACT_INFORMATION: z
      .stringbool()
      .default(false),

    // FSP: Commercial Bank of Ethiopia (CBE)
    MOCK_COMMERCIAL_BANK_ETHIOPIA: z.stringbool().default(false),
    COMMERCIAL_BANK_ETHIOPIA_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url)))
      .optional(),
    COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH: z.string().default(''),

    // FSP: Safaricom
    MOCK_SAFARICOM: z.stringbool().default(false),
    SAFARICOM_API_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url)))
      .optional(),
    SAFARICOM_CONSUMER_KEY: z.string().optional(),
    SAFARICOM_CONSUMER_SECRET: z.string().optional(),
    SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT: z
      .string()
      .optional()
      .pipe(z.transform((url) => withoutLeadingSlash(url))),
    SAFARICOM_INITIATORNAME: z.string().optional(),
    SAFARICOM_SECURITY_CREDENTIAL: z.string().optional(),
    SAFARICOM_PARTY_A: z.string().optional(),
    SAFARICOM_IDTYPE: z.string().optional(),

    // FSP: Nedbank
    MOCK_NEDBANK: z.stringbool().default(false),
    NEDBANK_ACCOUNT_NUMBER: z.string().min(10).optional(),
    NEDBANK_CLIENT_ID: z.string().optional(),
    NEDBANK_CLIENT_SECRET: z.string().optional(),
    NEDBANK_CERTIFICATE_PATH: z.string().default(''),
    NEDBANK_CERTIFICATE_PASSWORD: z.string().optional(),
    NEDBANK_API_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url)))
      .optional(),

    // FSP: Onafriq
    MOCK_ONAFRIQ: z.stringbool().default(false),
    ONAFRIQ_CORPORATE_CODE: z.string().optional(),
    ONAFRIQ_PASSWORD: z.string().optional(),
    ONAFRIQ_UNIQUE_KEY: z.string().optional(),
    ONAFRIQ_API_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url)))
      .optional(),
    ONAFRIQ_CURRENCY_CODE: z.string().length(3).optional(),
    ONAFRIQ_COUNTRY_CODE: z.string().length(2).optional(),
    ONAFRIQ_SFTP_HOST: z.string().optional(),
    ONAFRIQ_SFTP_PORT: z.coerce.number().default(22),
    ONAFRIQ_SFTP_USERNAME: z.string().optional(),
    ONAFRIQ_SFTP_PASSPHRASE: z.string().optional(),
    ONAFRIQ_SFTP_CERTIFICATE_CONTENT: z.string().optional(),
    ONAFRIQ_SFTP_CERTIFICATE_PATH: z.string().optional(),
    ONAFRIQ_SENDER_MSISDN: z.string().optional(),
    ONAFRIQ_SENDER_NAME: z.string().optional(),
    ONAFRIQ_SENDER_SURNAME: z.string().optional(),
    ONAFRIQ_SENDER_DOB: z.string().optional(),
    ONAFRIQ_SENDER_DOCUMENT_ID: z.string().optional(),
    ONAFRIQ_SENDER_DOCUMENT_TYPE: z.string().optional(),

    // FSP: Airtel
    AIRTEL_ENABLED: z.stringbool().default(false),
    MOCK_AIRTEL: z.stringbool().default(false),
    AIRTEL_CLIENT_ID: z.string().optional(),
    AIRTEL_CLIENT_SECRET: z.string().optional(),
    AIRTEL_API_URL: z
      .url()
      .pipe(z.transform((url) => withoutTrailingSlash(url)))
      .optional(),
    AIRTEL_DISBURSEMENT_PIN: z.string().length(4).optional(),
    AIRTEL_DISBURSEMENT_V1_PIN_ENCRYPTION_PUBLIC_KEY: z.string().optional(),
  },

  createFinalSchema: (shape) =>
    z.object(shape).transform((env, ctx) => {
      /**
       * List of FSP-dependent ENV-variables.
       * To validate that _all required variables_ are set, ONLY when a specific FSP is enabled.
       *
       * - Key: the FSP flag, format: `<FSP-NAME-PREFIX>_ENABLED`
       * - Value: array of required variable names.
       */
      const fspVariableRequirements = new Map<string, string[]>([
        [
          'AIRTEL_ENABLED',
          [
            'AIRTEL_CLIENT_ID',
            'AIRTEL_CLIENT_SECRET',
            'AIRTEL_API_URL',
            'AIRTEL_DISBURSEMENT_PIN',
            'AIRTEL_DISBURSEMENT_V1_PIN_ENCRYPTION_PUBLIC_KEY',
          ],
        ],
      ]);

      for (const [fspFlag, requiredVariables] of fspVariableRequirements) {
        if ((env as Record<string, unknown>)[fspFlag] !== true) {
          continue;
        }
        for (const variable of requiredVariables) {
          if ((env as Record<string, unknown>)[variable]) {
            continue;
          }
          ctx.addIssue({
            path: [variable],
            message: `The variable is required when ${fspFlag} is true.`,
          });
        }
      }

      // Make sure we do not set the NEDBANK_CERTIFICATE_PASSWORD in production
      if (env.NODE_ENV === 'production' && env.NEDBANK_CERTIFICATE_PASSWORD) {
        ctx.addIssue({
          path: ['NEDBANK_CERTIFICATE_PASSWORD'],
          message:
            'The NEDBANK_CERTIFICATE_PASSWORD variable must not be set in production.',
        });
      }

      return env;
    }),

  // We don't use client-side ENV-variables in the same way as in the services
  clientPrefix: '',
  client: {},
});
