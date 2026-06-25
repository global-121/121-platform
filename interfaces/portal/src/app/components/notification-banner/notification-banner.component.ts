import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

interface NotificationBannerContent {
  title: string;
  description: string;
  info?: string;
  icon?: NotificationBannerIcon;
}

export type NotificationBannerColor =
  | 'blue'
  | 'contrast'
  | 'green'
  | 'grey'
  | 'orange'
  | 'purple'
  | 'red'
  | 'yellow';

export type NotificationBannerIcon =
  | 'alert'
  | 'check'
  | 'info'
  | 'spinner'
  | 'warning';

@Component({
  selector: 'app-notification-banner',
  imports: [NgClass],
  templateUrl: './notification-banner.component.html',
  styles: ``,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBannerComponent {
  readonly content = input<NotificationBannerContent>();
  readonly color = input.required<NotificationBannerColor>();

  readonly wrapperVariant = computed(() => {
    // Do not replace with something like `bg-${this.variant()}-100` as it would not work with tailwind's JIT compiler
    // https://tailwindcss.com/docs/just-in-time-mode
    switch (this.color()) {
      case 'blue':
        return `border-blue-500 bg-blue-100 text-blue-700`;
      case 'green':
        return `border-green-500 bg-green-100 text-green-700`;
      case 'purple':
        return `border-purple-500 bg-purple-100 text-purple-900`;
      case 'red':
        return `border-red-500 bg-red-100 text-red-700`;
      case 'orange':
        return `border-orange-500 bg-orange-100 text-orange-700`;
      case 'yellow':
        return `border-yellow-500 bg-yellow-100 text-yellow-700`;
      case 'grey':
        return `border-grey-500 bg-grey-100 text-grey-700`;
      case 'contrast':
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
