import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';

import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-info-tooltip',
  imports: [TooltipModule],
  templateUrl: './info-tooltip.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoTooltipComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly message = input.required<string>();
}
