import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { InfoTooltipData } from '~/components/info-tooltip/info-tooltip.component';
import { InfoTooltipTrackingName } from '~/services/tracking/tracking.enums';
import { ColorVariant } from '~/utils/color-variant.enum';

@Component({
  selector: 'app-full-name-setup-needed-chip',
  imports: [ColoredChipComponent],
  template: `
    <app-colored-chip
      [variant]="ColorVariant.Grey"
      [label]="label"
      [infoTooltipData]="tooltipData"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullNameSetupNeededChipComponent {
  readonly ColorVariant = ColorVariant;
  readonly label = $localize`:@@full-name-setup-needed:Set up needed`;
  readonly tooltipData: InfoTooltipData = {
    message: $localize`:@@full-name-setup-needed-tooltip:To see the full name of the registration, an admin must set up the full name in the program’s settings.`,
    trackingName: InfoTooltipTrackingName.fullNameSetupNeeded,
  };
}
