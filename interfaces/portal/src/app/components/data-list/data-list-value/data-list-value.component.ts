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
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

import { getRandomInt } from '@121-service/src/utils/random-value.helper';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { DataListItem } from '~/components/data-list/data-list-item.type';
import { isImageAvailable } from '~/components/image/utils/is-image-available';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { ColorVariant } from '~/utils/color-variant.enum';

@Component({
  selector: 'app-data-list-value',
  imports: [
    TranslatableStringPipe,
    ColoredChipComponent,
    NgComponentOutlet,
    SkeletonModule,
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    TagModule,
    DatePipe,
    NgClass,
  ],
  templateUrl: './data-list-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListValueComponent {
  readonly item = input.required<DataListItem>();

  readonly skeletonWidth = `${getRandomInt(42, 98).toString()}%`;

  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  getChipProps({
    item,
  }: {
    item: DataListItem;
  }): { label: string; variant: ColorVariant } | undefined {
    if (item.type === 'koboImage') {
      return this.getKoboImageChipProps({ imageUrl: item.value });
    }

    if (!item.chipLabel || !item.chipVariant) {
      return;
    }

    return { label: item.chipLabel, variant: item.chipVariant };
  }

  private getKoboImageChipProps({ imageUrl }: { imageUrl: string }) {
    const isAvailable = isImageAvailable({ imageUrl });

    return {
      label: isAvailable
        ? $localize`:@@image-available:Available`
        : $localize`:@@image-not-available:Not available`,
      variant: isAvailable ? ColorVariant.Green : ColorVariant.Red,
    };
  }

  hasValue({ value }: { value: unknown }): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim() !== '';
    }

    return true;
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
