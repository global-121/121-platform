import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './project-overview.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewComponent {
  // this is injected by the router
  projectId = input.required<number>();
}
