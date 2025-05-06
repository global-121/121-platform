import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-change-status-submit-buttons',
  imports: [ButtonModule],
  templateUrl: './change-status-submit-buttons.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusSubmitButtonsComponent {
  readonly isMutating = input<boolean>(false);
  readonly cancelClick = output();
  readonly approveClick = output<MouseEvent>();
}
