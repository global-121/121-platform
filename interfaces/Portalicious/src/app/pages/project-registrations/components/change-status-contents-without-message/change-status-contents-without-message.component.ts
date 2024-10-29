import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-change-status-contents-without-message',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './change-status-contents-without-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithoutMessageComponent {
  readonly onCancel = output();

  cancelClick() {
    this.onCancel.emit();
  }
}
