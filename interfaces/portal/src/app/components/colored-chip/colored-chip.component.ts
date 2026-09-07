import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

import { ColorVariant } from '~/utils/color-variant.enum';

@Component({
  selector: 'app-colored-chip',
  imports: [ChipModule, TooltipModule],
  templateUrl: './colored-chip.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColoredChipComponent {
  readonly variant = input.required<ColorVariant>();
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly tooltip = input<string>();
  readonly wrapText = input(false);

  readonly styleClass = computed(() => {
    const baseClass: string[] = [];

    if (this.tooltip()) {
      baseClass.push('cursor-help');
    }

    if (!this.wrapText()) {
      baseClass.push('whitespace-nowrap');
    }

    const classString = baseClass.length ? baseClass.join(' ') : '';

    // Do not replace with something like `bg-${this.variant()}-100` as it would not work with tailwind's JIT compiler
    // https://tailwindcss.com/docs/just-in-time-mode
    const variant = this.variant();
    switch (variant) {
      case ColorVariant.Blue:
        return `${classString} bg-blue-100 text-blue-700`;
      case ColorVariant.Green:
        return `${classString} bg-green-100 text-green-700`;
      case ColorVariant.Purple:
        return `${classString} bg-purple-100 text-purple-900`;
      case ColorVariant.Red:
        return `${classString} bg-red-100 text-red-700`;
      case ColorVariant.Orange:
        return `${classString} bg-orange-100 text-orange-700`;
      case ColorVariant.Yellow:
        return `${classString} bg-yellow-100 text-yellow-700`;
      case ColorVariant.Grey:
        return `${classString} bg-grey-100 text-grey-700`;
      case ColorVariant.Contrast:
        return `${classString} bg-grey-50 text-grey-900`;
      default:
        variant satisfies never;
        return;
    }
  });
}
