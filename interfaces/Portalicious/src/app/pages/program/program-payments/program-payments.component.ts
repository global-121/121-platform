import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-program-payments',
  standalone: true,
  imports: [PageLayoutComponent],
  templateUrl: './program-payments.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramPaymentsComponent {
  // this is injected by the router
  programId = input.required<string>();
}
