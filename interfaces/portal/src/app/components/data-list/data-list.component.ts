import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  NgClass,
  NgComponentOutlet,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  Type,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { getRandomInt } from '@121-service/src/utils/random-value.helper';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { TranslatableStringService } from '~/services/translatable-string.service';

export type DataListItem = {
  label: string | UILanguageTranslation;
  tooltip?: string;
  loading?: boolean;
  chipLabel?: string;
  chipVariant?: ChipVariant;
  fullWidth?: boolean;
  detailAction?: {
    component: Type<unknown>;
    inputs: Record<string, unknown>;
  };
  dataTestId?: string;
} & (
  | {
      type: 'boolean';
      value: boolean;
    }
  | {
      type: 'code';
      value?: null | string;
    }
  | {
      type: 'currency';
      value?: null | number;
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
      type: 'options';
      value: string | string[];
      options?: {
        value: string;
        label?: string | UILanguageTranslation;
      }[];
    }
  | {
      type?: 'text';
      value?: null | string | UILanguageTranslation;
      routerLink?: RouterLink['routerLink'];
    }
);

@Component({
  selector: 'app-data-list',
  imports: [
    InfoTooltipComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    SkeletonModule,
    ColoredChipComponent,
    TranslatableStringPipe,
    NgClass,
    NgComponentOutlet,
    RouterLink,
    InputTextModule,
  ],
  templateUrl: './data-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListComponent {
  readonly data = input.required<DataListItem[]>();
  readonly hideBottomBorder = input<boolean>();
  readonly dataTestId = input<string>('data-list');
  readonly forceOneColumn = input<boolean>(false);

  readonly translatableStringService = inject(TranslatableStringService);

  skeletonWidth() {
    return `${getRandomInt(42, 98).toString()}%`;
  }

  optionItemValue(item: { type: 'options' } & DataListItem) {
    const value = Array.isArray(item.value) ? item.value : [item.value];

    const valueList = value.map((v) => {
      const option = item.options?.find((o) => o.value === v);

      return this.translatableStringService.translate(option?.label) ?? v;
    });

    return this.translatableStringService.commaSeparatedList({
      values: valueList,
    });
  }
}
