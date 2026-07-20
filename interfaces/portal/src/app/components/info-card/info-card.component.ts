import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-info-card',
  imports: [CardModule],
  templateUrl: './info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInfoCardComponent {
  readonly title = input.required<string>();

  readonly subtitle = input.required<string>();

  readonly omitIcon = input<boolean>();
  readonly dataTestId = input<string>();

  readonly customIcon = input<{
    size?: 'large' | 'medium' | 'small';
    icon: string;
  }>();
}
