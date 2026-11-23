import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ProgressSpinnerModule } from '@openng/optimus-ui/progressspinner';

@Component({
  selector: 'app-fullscreen-spinner',
  imports: [ProgressSpinnerModule],
  templateUrl: './fullscreen-spinner.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenSpinnerComponent {
  readonly loading = input.required<boolean>();
}
