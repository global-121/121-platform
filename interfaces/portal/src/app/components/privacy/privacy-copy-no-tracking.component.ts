import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-privacy-copy-no-tracking',
  imports: [],
  template: `
    <p i18n>
      We do not share any personal information with other third-parties.
    </p>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyCopyNoTrackingComponent {}
