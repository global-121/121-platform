import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-empty-message',
  imports: [CardModule],
  templateUrl: './empty-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppEmptyMessageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();

  sizeClassMap: Record<string, string> = {
    small: 'h-8',
    medium: 'h-16',
    large: 'h-24',
  };

  readonly customIcon = input<{
    size: 'large' | 'medium' | 'small';
    icon: string;
  }>();
}
