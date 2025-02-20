import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { environment } from '~environment';

@Component({
  selector: 'app-privacy-page',
  imports: [PageLayoutComponent, DatePipe],
  templateUrl: './privacy.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPageComponent {
  public isMatomoEnabled = !!environment.matomo_connection_string;
}
