import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-payment',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './project-payment.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentPageComponent {
  readonly projectId = input.required<number>();
  readonly paymentId = input.required<number>();
}
