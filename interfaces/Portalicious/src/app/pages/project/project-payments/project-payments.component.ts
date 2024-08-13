import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-payments',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './project-payments.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsComponent {
  // this is injected by the router
  projectId = input.required<string>();
}
