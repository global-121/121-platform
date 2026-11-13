import { Injectable, OnApplicationShutdown } from '@nestjs/common';

import { shutdownApplicationInsights } from '@121-service/src/telemetry/application-insights-lifecycle';

@Injectable()
export class ApplicationInsightsShutdownService implements OnApplicationShutdown {
  public async onApplicationShutdown(): Promise<void> {
    await shutdownApplicationInsights();
  }
}
