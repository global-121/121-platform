import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-privacy-copy-tracking',
  imports: [],
  template: `
    <p i18n>
      We use the external "<em>Matomo Cloud</em>"-service by InnoCraft Ltd. to
      measure the usage of the 121 Platform.
    </p>
    <p i18n>
      We do not share any personal information with Matomo/InnoCraft Ltd. Our
      use of their service is covered by the
      <a
        href="https://matomo.org/matomo-cloud-privacy-policy/"
        target="_blank"
        >Matomo Cloud Privacy Policy</a
      >
      and the
      <a
        href="https://matomo.org/matomo-cloud-dpa/"
        target="_blank"
        >Matomo Cloud Data Processing Agreement</a
      >.
    </p>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyCopyTrackingComponent {}
