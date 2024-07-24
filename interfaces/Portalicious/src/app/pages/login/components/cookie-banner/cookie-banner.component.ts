import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './cookie-banner.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBannerComponent {
  isReadingMore = signal(false);
}
