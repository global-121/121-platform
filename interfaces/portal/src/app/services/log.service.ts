import { Injectable } from '@angular/core';

import { ApplicationInsights } from '@microsoft/applicationinsights-web';

import { environment } from '~environment';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private appInsights: ApplicationInsights;
  private appInsightsInitialized: boolean;

  public setupApplicationInsights() {
    if (
      !environment.applicationinsights_connection_string ||
      this.appInsightsInitialized
    ) {
      return;
    }

    this.appInsights = new ApplicationInsights({
      config: {
        // All properties sorted alphabetically.
        connectionString: environment.applicationinsights_connection_string,
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

    this.appInsights.addTelemetryInitializer((envelope) => {
      if (!envelope.tags) return;
      envelope.tags['ai.cloud.role'] = 'portal';
      envelope.tags['ai.cloud.roleInstance'] = window.location.hostname;
    });
    this.appInsights.loadAppInsights();
    this.appInsightsInitialized = true;
  }

  public logEvent(
    name: string,
    properties?: Record<string, boolean | number | string>,
  ): void {
    if (this.appInsightsInitialized) {
      this.appInsights.trackEvent({ name }, properties);
    }
    console.info(`LOG Event: "${name}"`, properties);
  }

  public logException(exception: Error): void {
    if (this.appInsightsInitialized) {
      this.appInsights.trackException({
        exception,
      });
    }
    console.error(`LOG Exception`, exception);
  }

  public logTrace(
    message: string,
    properties?: Record<string, boolean | number | string>,
  ): void {
    if (this.appInsightsInitialized) {
      this.appInsights.trackTrace({ message }, properties);
    }
    console.error(`LOG Trace: "${message}"`, properties);
  }
}
