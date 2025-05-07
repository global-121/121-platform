import { DatePipe, NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { TrackingService } from '~/services/tracking.service';

@Component({
  selector: 'app-privacy-page',
  imports: [PageLayoutComponent, DatePipe, NgComponentOutlet],
  templateUrl: './privacy.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPageComponent {
  readonly trackingService = inject(TrackingService);

  TrackingCopyComponent = this.trackingService.PrivacyCopyComponent;
}
