import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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
  readonly href = input<RouterLink['routerLink']>();
  readonly title = input.required<string>();
  readonly titleColoredChipLabel = input<string>();
  readonly titleColoredChipColor = input<ChipVariant>('grey');
  readonly image = input<string>();
  readonly loading = input(false);
  readonly enableLink = input(true);
  readonly cardClicked = output();
  readonly menuItems = input<MenuItem[]>([]);
}
