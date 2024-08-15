import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-registrations',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './project-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationsComponent {
  // this is injected by the router
  projectId = input.required<number>();
}
