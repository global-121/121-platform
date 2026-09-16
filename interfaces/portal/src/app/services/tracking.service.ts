import {
  EnvironmentProviders,
  inject,
  Injectable,
  isDevMode,
  Provider,
} from '@angular/core';

import { MatomoTracker, provideMatomo, withRouter } from 'ngx-matomo-client';
import { parseMatomoConnectionString } from 'scripts/lib/matomo.utils.mjs';

import { AppRoutes } from '~/app.routes';
import { PrivacyCopyNoTrackingComponent } from '~/components/privacy/privacy-copy-no-tracking.component';
import { PrivacyCopyTrackingComponent } from '~/components/privacy/privacy-copy-tracking.component';
import { TrackingEvent } from '~/services/tracking.enum';
import { environment } from '~environment';

const MATOMO_CONNECTION_INFO = parseMatomoConnectionString(
  environment.matomo_connection_string,
);

const IS_MATOMO_ENABLED = () =>
  MATOMO_CONNECTION_INFO.id &&
  MATOMO_CONNECTION_INFO.api &&
  MATOMO_CONNECTION_INFO.sdk;

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  // Lazy getter to avoid reading `AppRoutes` at module-load time, which can be
  // `undefined` due to circular imports and crash app bootstrap.
  public static get APP_PROVIDERS(): (EnvironmentProviders | Provider)[] {
    return IS_MATOMO_ENABLED()
      ? [
          provideMatomo(
            {
              siteId: MATOMO_CONNECTION_INFO.id,
              trackerUrl: MATOMO_CONNECTION_INFO.api,
              trackerUrlSuffix: '', // Should be included in `connectionInfo.api` used as `trackerUrl`
              scriptUrl: MATOMO_CONNECTION_INFO.sdk,
              acceptDoNotTrack: true, // Prevent unnecessary requests to the Matomo API
              requireConsent: 'none', // Will change with AB#33767
              runOutsideAngularZone: true,
              enableJSErrorTracking: false, // We use ApplicationInsights for this
              enableLinkTracking: 'enable-pseudo', // Enable tracking of right/middle-clicks
              trackAppInitialLoad: false,
            },
            withRouter({
              exclude: [new RegExp(AppRoutes.authCallback)],
            }),
          ),
        ]
      : [];
  }

  private readonly tracker = IS_MATOMO_ENABLED()
    ? inject(MatomoTracker)
    : undefined;

  public get PrivacyCopyComponent() {
    return IS_MATOMO_ENABLED()
      ? PrivacyCopyTrackingComponent
      : PrivacyCopyNoTrackingComponent;
  }

  /**
   *
   * @example Using only the `name`-property
   * ```ts
   * this.trackingService.trackEvent({
   *   category: TrackingCategory.export,
   *   action: TrackingAction.clickMenuOption,
   *   name: 'Export to PDF',
   * });
   * ```
   * @example Using a numeric value for the `value`-property
   * ```ts
   * this.trackingService.trackEvent({
   *  category: TrackingCategory.filterRegistrations,
   *  action: TrackingAction.inputFreeText,
   *  name: 'Nr. of Results',
   *  value: apiResponse.results.length,
   * });
   * ```
   *
   */
  public trackEvent(event: TrackingEvent): void {
    if (!environment.production || isDevMode()) {
      console.info('TrackingEvent:', event);
    }

    const { category, action, name, value } = event;
    this.tracker?.trackEvent(category, action, name, value);
  }
}
