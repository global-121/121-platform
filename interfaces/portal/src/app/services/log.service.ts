import { Injectable } from '@angular/core';

import type { ApplicationInsights } from '@microsoft/applicationinsights-web';

import { environment } from '~environment';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  // Holding the promise means events logged while the library loads are not lost
  private appInsightsPromise?: Promise<ApplicationInsights>;

  public setupApplicationInsights(): void {
    if (
      !environment.applicationinsights_connection_string ||
      this.appInsightsPromise
    ) {
      return;
    }

    this.appInsightsPromise = this.createApplicationInsights({
      connectionString: environment.applicationinsights_connection_string,
    });
  }

  private async createApplicationInsights({
    connectionString,
  }: {
    connectionString: string;
  }): Promise<ApplicationInsights> {
    const { ApplicationInsights } =
      await import('@microsoft/applicationinsights-web');

    const appInsights = new ApplicationInsights({
      config: {
        // All properties sorted alphabetically.
        connectionString,
        disableCookiesUsage: true,
        autoTrackPageVisitTime: true,
        enableAutoRouteTracking: true,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        enableAjaxErrorStatusText: true,
        enableSessionStorageBuffer: true,
        enableUnhandledPromiseRejectionTracking: true,
        loggingLevelConsole: 2,
        loggingLevelTelemetry: 2,
        extensionConfig: {
          ['AppInsightsCfgSyncPlugin']: { cfgUrl: '' },
        },
      },
    });

    appInsights.addTelemetryInitializer((envelope) => {
      if (!envelope.tags) return;
      envelope.tags['ai.cloud.role'] = 'portal';
      envelope.tags['ai.cloud.roleInstance'] = window.location.hostname;
    });
    appInsights.loadAppInsights();
    return appInsights;
  }

  public logEvent(
    name: string,
    properties?: Record<string, boolean | number | string>,
  ): void {
    void this.withAppInsights((appInsights) => {
      appInsights.trackEvent({ name }, properties);
    });
    console.info(`LOG Event: "${name}"`, properties);
  }

  public logException(exception: Error): void {
    void this.withAppInsights((appInsights) => {
      appInsights.trackException({ exception });
    });
    console.error(`LOG Exception`, exception);
  }

  public logTrace(
    message: string,
    properties?: Record<string, boolean | number | string>,
  ): void {
    void this.withAppInsights((appInsights) => {
      appInsights.trackTrace({ message }, properties);
    });
    console.error(`LOG Trace: "${message}"`, properties);
  }

  private async withAppInsights(
    track: (appInsights: ApplicationInsights) => void,
  ): Promise<void> {
    if (!this.appInsightsPromise) {
      return;
    }
    track(await this.appInsightsPromise);
  }
}
