import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-program-overview',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './program-overview.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramOverviewComponent {
  // this is injected by the router
  programId = input.required<string>();
}
