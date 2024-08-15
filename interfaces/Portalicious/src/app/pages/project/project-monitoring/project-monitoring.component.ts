import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-monitoring',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './project-monitoring.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMonitoringComponent {
  // this is injected by the router
  projectId = input.required<number>();
}
