import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-program-registrations',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './program-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramRegistrationsComponent {
  // this is injected by the router
  programId = input.required<string>();
}
