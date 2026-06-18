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

  readonly customIcon = input<{
    size: string;
    icon: string;
  }>();
}
