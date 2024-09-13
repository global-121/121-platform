import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

export type ChipVariant =
  | 'blue'
  | 'green'
  | 'grey'
  | 'orange'
  | 'purple'
  | 'red';

@Component({
  selector: 'app-colored-chip',
  standalone: true,
  imports: [ChipModule, TooltipModule],
  templateUrl: './colored-chip.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColoredChipComponent {
  variant = input.required<ChipVariant>();
  label = input.required<string>();
  icon = input<string>();
  tooltip = input<string>();

  styleClass = computed(() => {
    let baseClass = '';

    if (this.tooltip()) {
      baseClass = 'cursor-help';
    }

    // Do not replace with something like `bg-${this.variant()}-100` as it would not work with tailwind's JIT compiler
    // https://tailwindcss.com/docs/just-in-time-mode
    switch (this.variant()) {
      case 'blue':
        return `${baseClass} bg-blue-100 text-blue-700`;
      case 'green':
        return `${baseClass} bg-green-100 text-green-700`;
      case 'purple':
        return `${baseClass} bg-purple-100 text-purple-700`;
      case 'red':
        return `${baseClass} bg-red-100 text-red-700`;
      case 'orange':
        return `${baseClass} bg-orange-100 text-orange-700`;
      case 'grey':
        return `${baseClass} bg-grey-100 text-grey-700`;
      default:
        return '';
    }
  });
}
