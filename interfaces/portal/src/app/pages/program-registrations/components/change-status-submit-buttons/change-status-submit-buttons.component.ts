import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { REGISTRATION_UPDATE_DIALOG_SUBMIT_BUTTON_LABELS } from '~/domains/registration/registration.helper';

@Component({
  selector: 'app-change-status-submit-buttons',
  imports: [ButtonModule],
  templateUrl: './change-status-submit-buttons.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusSubmitButtonsComponent {
  readonly isMutating = input(false);
  readonly cancelClick = output();
  readonly approveClick = output<MouseEvent>();
  readonly status = input<RegistrationStatusEnum | undefined>();

  readonly buttonText = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_UPDATE_DIALOG_SUBMIT_BUTTON_LABELS[status];
  });
}
