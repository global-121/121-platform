import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-info-tooltip',
  imports: [TooltipModule],
  templateUrl: './info-tooltip.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoTooltipComponent {
  message = input.required<string>();
}
