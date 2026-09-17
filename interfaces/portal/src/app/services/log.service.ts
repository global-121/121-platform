import {
  ErrorHandler,
  inject,
  Injectable,
  isDevMode,
  Provider,
} from '@angular/core';

import {
  ApplicationInsights,
  SeverityLevel,
} from '@microsoft/applicationinsights-web';

import { environment } from '~environment';

/**
 * Global Angular error-handler that forwards every otherwise-uncaught error to
 * Application Insights through the central `LogService`.
 *
 * Registering this (via `LogService.APP_PROVIDERS`) replaces Angular's default
 * `ErrorHandler`, which would only log errors to the browser-console.
 *
 * See: https://angular.dev/api/core/ErrorHandler
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logService = inject(LogService);

  public handleError(error: unknown): void {
    const exception = error instanceof Error ? error : new Error(String(error));

    this.logService.logException(exception);
  }
}

/**
 * Central service for all "telemetry"/logging towards Application Insights.
 *
 * This is the single, "standard" place to send events, traces and exceptions
 * to Application Insights. Use this service instead of calling the
 * Application Insights SDK directly, so configuration and console-logging
 * behaviour stays consistent across the whole Portal.
 *
 * See:
 * - https://github.com/microsoft/applicationinsights-js#setting-up-autocollection
 * - https://microsoft.github.io/ApplicationInsights-JS/exceptionTelemetry
 */
@Injectable({
  providedIn: 'root',
})
export class LogService {
  /**
   * Application-wide providers that wire up centralized logging.
   *
   * This registers a global Angular `ErrorHandler` so that *all* otherwise
   * uncaught errors (thrown from components, services, templates, lifecycle
   * hooks, etc.) are reported to Application Insights. Without this, Angular's
   * default `ErrorHandler` only writes such errors to the browser-console and
   * they never reach Application Insights.
   *
   * See: https://angular.dev/api/core/ErrorHandler
   */
  public static readonly APP_PROVIDERS: Provider[] = [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ];

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
        // Auto-collect uncaught exceptions (`window.onerror`). This is enabled
        // by default, but set explicitly to document the intent.
        // See: https://github.com/microsoft/applicationinsights-js#configuration
        disableExceptionTracking: false,
        enableAutoRouteTracking: true,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        enableAjaxErrorStatusText: true,
        enableSessionStorageBuffer: true,
        // Auto-collect unhandled promise-rejections as exceptions.
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
    if (isDevMode()) {
      console.info(`LOG Event: "${name}"`, properties ?? '');
    }
  }

  public logException(
    exception: Error,
    properties?: Record<string, boolean | number | string>,
  ): void {
    if (this.appInsightsInitialized) {
      this.appInsights.trackException({
        exception,
        severityLevel: SeverityLevel.Error,
        properties,
      });
    }
    console.error('LOG Exception:', exception, properties ?? '');
  }

  public logTrace(
    message: string,
    properties?: Record<string, boolean | number | string>,
  ): void {
    if (this.appInsightsInitialized) {
      this.appInsights.trackTrace(
        { message, severityLevel: SeverityLevel.Information },
        properties,
      );
    }
    if (isDevMode()) {
      console.info(`LOG Trace: "${message}"`, properties ?? '');
    }
  }
}
