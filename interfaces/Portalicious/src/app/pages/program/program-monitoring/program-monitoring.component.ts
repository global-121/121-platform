import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-program-monitoring',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './program-monitoring.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramMonitoringComponent {
  // this is injected by the router
  programId = input.required<string>();
}
