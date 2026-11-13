import * as appInsights from 'applicationinsights';
import type { IncomingMessage } from 'node:http';

import { env } from '@121-service/src/env';
import { INTERFACE_NAME_HEADER } from '@121-service/src/shared/enum/interface-names.enum';

export function initializeApplicationInsights(): void {
  if (!env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    return;
  }

  const httpInstrumentationOptions = {
    enabled: true,
    startIncomingSpanHook: (
      request: IncomingMessage,
    ): Record<string, string | string[]> => {
      const interfaceName = request.headers[INTERFACE_NAME_HEADER];
      if (!interfaceName) {
        return {};
      }

      return { interface: interfaceName };
    },
  };

  appInsights
    .setup(env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAzureMonitorOptions({
      tracesPerSecond: 0,
      instrumentationOptions: { http: httpInstrumentationOptions },
    })
    .start();
}
