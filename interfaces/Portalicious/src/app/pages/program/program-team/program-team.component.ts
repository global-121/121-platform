import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-program-team',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './program-team.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramTeamComponent {
  // this is injected by the router
  programId = input.required<string>();
}
