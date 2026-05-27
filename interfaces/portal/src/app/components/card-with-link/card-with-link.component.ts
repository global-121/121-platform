import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { EllipsisMenuComponent } from '~/components/ellipsis-menu/ellipsis-menu.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';

@Component({
  selector: 'app-card-with-link',
  imports: [
    CardModule,
    NgClass,
    RouterLink,
    SkeletonInlineComponent,
    NgTemplateOutlet,
    ColoredChipComponent,
    EllipsisMenuComponent,
  ],
  templateUrl: './card-with-link.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardWithLinkComponent {
  readonly overrideCss = input('');

  readonly className = computed(() => {
    const baseClasses =
      'group shadow-clickable-cards border-grey-300 relative h-full rounded-lg border bg-white transition-colors focus-within:border-purple-500 hover:border-purple-500';
    return `${baseClasses} ${this.overrideCss()}`;
  });

  readonly href = input<RouterLink['routerLink']>();
  readonly title = input.required<string>();
  readonly titleColoredChipLabel = input<string>();
  readonly titleColoredChipColor = input<ChipVariant>('grey');
  readonly image = input<string>();
  readonly loading = input(false);
  // readonly subtitle = input<string>();
  readonly enableLink = input(true);
  readonly cardClicked = output();
  readonly menuItems = input<MenuItem[]>([]);
}
