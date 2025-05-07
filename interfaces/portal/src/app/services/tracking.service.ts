import { Injectable } from '@angular/core';

import { parseMatomoConnectionString } from '_matomo.utils.mjs';
import { provideMatomo, withRouter } from 'ngx-matomo-client';

import { AppRoutes } from '~/app.routes';
import { PrivacyCopyNoTrackingComponent } from '~/components/privacy/privacy-copy-no-tracking.component';
import { PrivacyCopyTrackingComponent } from '~/components/privacy/privacy-copy-tracking.component';
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
  public static APP_PROVIDERS = IS_MATOMO_ENABLED()
    ? [
        provideMatomo(
          {
            siteId: MATOMO_CONNECTION_INFO.id,
            trackerUrl: MATOMO_CONNECTION_INFO.api,
            trackerUrlSuffix: '', // Should be included in `connectionInfo.api` used as `trackerUrl`

            scriptUrl: MATOMO_CONNECTION_INFO.sdk,
            enableJSErrorTracking: true,
            requireConsent: 'none',
            runOutsideAngularZone: true,
          },
          withRouter({
            exclude: [new RegExp(AppRoutes.authCallback)],
          }),
        ),
      ]
    : [];

  public get PrivacyCopyComponent() {
    return IS_MATOMO_ENABLED()
      ? PrivacyCopyTrackingComponent
      : PrivacyCopyNoTrackingComponent;
  }

  // TODO: AB#33807 - implement and use this function
  public trackEvent() {
    if (!IS_MATOMO_ENABLED()) {
      return;
    }

    // track event to matomo
  }
}
