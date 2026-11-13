import type { Span } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { resourceFromAttributes } from '@opentelemetry/resources';
import * as appInsights from 'applicationinsights';
import type { ClientRequest, IncomingMessage } from 'node:http';

import { env } from '@121-service/src/env';
import { INTERFACE_NAME_HEADER } from '@121-service/src/shared/enum/interface-names.enum';
import {
  createTelemetryPrivacyProcessor,
  enrichHttpRequest,
} from '@121-service/src/telemetry/telemetry-privacy.helper';

export function initializeApplicationInsights(): void {
  if (!env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    return;
  }

  const httpInstrumentationOptions = {
    enabled: true,
    applyCustomAttributesOnSpan: (
      span: Span,
      request: IncomingMessage | ClientRequest,
    ): void => enrichHttpRequest({ span, request }),
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
    .setAutoCollectExceptions(false)
    .setAzureMonitorOptions({
      resource: resourceFromAttributes({
        'service.name': '121-service',
        ...(env.GLOBAL_121_VERSION
          ? { 'service.version': env.GLOBAL_121_VERSION }
          : {}),
      }),
      tracesPerSecond: 0,
      spanProcessors: [createTelemetryPrivacyProcessor()],
      instrumentationOptions: { http: httpInstrumentationOptions },
    });

  appInsights.start();
  registerInstrumentations({
    instrumentations: [
      new IORedisInstrumentation({
        dbStatementSerializer: (command) => command,
      }),
    ],
  });
}
