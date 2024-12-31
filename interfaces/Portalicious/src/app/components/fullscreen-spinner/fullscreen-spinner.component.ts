import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-fullscreen-spinner',
  imports: [BlockUIModule, ProgressSpinnerModule],
  templateUrl: './fullscreen-spinner.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenSpinnerComponent {
  loading = input.required<boolean>();
}
