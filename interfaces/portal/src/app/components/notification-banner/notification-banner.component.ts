import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ColorVariant } from '~/utils/color-variant.enum';

/**
 * `title`, `description`, and `info` must be translated strings.
 */
export interface NotificationBannerContent {
  title: string;
  description?: string;
  info?: string;
  icon?: NotificationBannerIcon;
}

export type NotificationBannerIcon =
  'alert' | 'check' | 'info' | 'spinner' | 'warning';

@Component({
  selector: 'app-notification-banner',
  imports: [NgClass],
  templateUrl: './notification-banner.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBannerComponent {
  readonly content = input<NotificationBannerContent>();
  readonly color = input.required<ColorVariant>();

  readonly wrapperColorVariantClass = computed(() => {
    // Do not replace with something like `bg-${this.variant()}-100` as it would not work with tailwind's JIT compiler
    // https://tailwindcss.com/docs/just-in-time-mode
    switch (this.color()) {
      case ColorVariant.Blue:
        return `border-blue-500 bg-blue-100 text-blue-700`;
      case ColorVariant.Green:
        return `border-green-500 bg-green-100 text-green-700`;
      case ColorVariant.Purple:
        return `border-purple-500 bg-purple-100 text-purple-900`;
      case ColorVariant.Red:
        return `border-red-500 bg-red-100 text-red-700`;
      case ColorVariant.Orange:
        return `border-orange-500 bg-orange-100 text-orange-700`;
      case ColorVariant.Yellow:
        return `border-yellow-500 bg-yellow-100 text-yellow-700`;
      case ColorVariant.Grey:
        return `border-grey-500 bg-grey-100 text-grey-700`;
      case ColorVariant.Contrast:
        return `border-grey-50 bg-grey-50 text-grey-900`;
      default:
        return '';
    }
  });

  readonly iconVariant = computed(() => {
    switch (this.content()?.icon) {
      case 'info':
        return `pi pi-info`;
      case 'check':
        return `pi pi-check`;
      case 'spinner':
        return `pi pi-spinner animate-spin`;
      case 'warning':
        return `pi pi-exclamation-triangle`;
      case 'alert':
        return `pi pi-exclamation-circle`;
      default:
        return '';
    }
  });
}
