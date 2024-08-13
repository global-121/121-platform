import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-team',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './project-team.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTeamComponent {
  // this is injected by the router
  projectId = input.required<string>();
}
