import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-payments',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './project-payments.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsPageComponent {
  // this is injected by the router
  projectId = input.required<number>();
}
