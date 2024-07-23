import { Injectable } from '@angular/core';
import { DebugPlugin } from '@microsoft/applicationinsights-debugplugin-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { environment } from 'src/environments/environment';

export enum LogEvent {
  userLogin = 'user/login',
  userLogout = 'user/logout',
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private appInsights: ApplicationInsights;
  private appInsightsInitialized: boolean;

  constructor() {
    this.setupApplicationInsights();
  }

  private setupApplicationInsights() {
    if (
      !environment.applicationinsights_connection_string ||
      this.appInsightsInitialized
    ) {
      return;
    }

    let debugPluginInstance;
    let debugPluginConfig: Record<string, unknown> = {};

    if (!environment.production) {
      debugPluginInstance = new DebugPlugin();
      debugPluginConfig = {
        [DebugPlugin.identifier]: {
          // See: https://github.com/microsoft/ApplicationInsights-JS/tree/main/extensions/applicationinsights-debugplugin-js#basic-usage
          trackers: [
            'trackDependencyData',
            'trackEvent',
            'trackException',
            'trackMetric',
            'trackPageView',
            'trackTrace',
          ],
        },
      };
    }

    this.appInsights = new ApplicationInsights({
      config: {
        // All properties sorted alphabetically.
        connectionString: environment.applicationinsights_connection_string,
        disableCookiesUsage: true,
        autoTrackPageVisitTime: true,
        enableAutoRouteTracking: true,
        enableCorsCorrelation: true,
        // enableDebug: !environment.production,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        enableAjaxErrorStatusText: true,
        enableSessionStorageBuffer: true,
        enableUnhandledPromiseRejectionTracking: true,
        extensions: debugPluginInstance ? [debugPluginInstance] : [],
        loggingLevelConsole: 2,
        loggingLevelTelemetry: 2,
        extensionConfig: {
          ['AppInsightsCfgSyncPlugin']: { cfgUrl: '' },
          ...debugPluginConfig,
        },
      },
    });

    this.appInsights.loadAppInsights();
    this.appInsightsInitialized = true;
  }

  public logPageView(name?: string): void {
    if (this.appInsightsInitialized) {
      this.appInsights.trackPageView({ name });
    }
    console.info(`LOG: PageView: "${name ?? ''}"`);
  }

  public logEvent(
    name: LogEvent,
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
