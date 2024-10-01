import { CurrencyPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SkeletonModule } from 'primeng/skeleton';

import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { getRandomInt } from '@121-service/src/utils/getRandomValue.helper';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

export type DataListItem = {
  label: LocalizedString | string;
  tooltip?: string;
  loading?: boolean;
  chipLabel?: string;
  chipVariant?: ChipVariant;
} & (
  | {
      type: 'boolean';
      value: boolean;
    }
  | {
      type: 'currency';
      value?: null | number | string;
      currencyCode?: null | string;
      currencyFormat?: string;
    }
  | {
      type: 'date';
      value?: Date | null | number | string;
    }
  | {
      type: 'number';
      value?: null | number;
    }
  | {
      type?: 'text';
      value?: LocalizedString | null | string;
    }
);

@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [
    InfoTooltipComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    SkeletonModule,
    SkeletonInlineComponent,
    ColoredChipComponent,
    TranslatableStringPipe,
    NgClass,
  ],
  templateUrl: './data-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListComponent {
  data = input.required<DataListItem[]>();
  hideBottomBorder = input<boolean>();

  skeletonWidth() {
    return `${getRandomInt(42, 98).toString()}%`;
  }
}
