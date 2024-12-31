import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';

import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';

@Component({
  selector: 'app-card-with-link',
  imports: [CardModule, RouterLink, SkeletonInlineComponent],
  templateUrl: './card-with-link.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardWithLinkComponent {
  href = input.required<RouterLink['routerLink']>();
  title = input.required<string>();
  loading = input<boolean>(false);
}
