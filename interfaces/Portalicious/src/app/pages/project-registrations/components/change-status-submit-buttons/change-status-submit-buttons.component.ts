import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-change-status-submit-buttons',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './change-status-submit-buttons.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusSubmitButtonsComponent {
  isMutating = input<boolean>(false);
  readonly onCancelClick = output();
  readonly onApproveClick = output<MouseEvent>();
}
