import { createEnv } from '@t3-oss/env-core';
import { withoutTrailingSlash } from 'ufo';
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
   * For guidelines, see: `services/121-service/src/env.ts`
   */
  server: {
    // Environment/Instance specifics
    ENV_NAME: z.string().optional(),
    ENV_ICON: z.url().or(z.string().startsWith('data:')).optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    GLOBAL_121_VERSION: z.string().optional(),

    // API set up
    PORT_121_SERVICE: z.coerce.number().optional(),
    PORT_MOCK_SERVICE: z.coerce.number().default(8080),

    EXTERNAL_121_SERVICE_URL: z
      .url()
      .pipe(
        z.transform((url: string) =>
          // For local-development; Make sure the Mock-Service connects to the 'internal' URL of the 121-Service, as the `localhost` is the _host-OS_, not this container's
          url.replace('http://localhost:', 'http://121-service:'),
        ),
      )
      .pipe(z.transform((url) => withoutTrailingSlash(url))),

    // FSP-specific configuration:
    INTERSOLVE_VISA_ASSET_CODE: z.string().default(''),
  },

  // We don't use client-side ENV-variables in the same way as in the services
  clientPrefix: '',
  client: {},
});
