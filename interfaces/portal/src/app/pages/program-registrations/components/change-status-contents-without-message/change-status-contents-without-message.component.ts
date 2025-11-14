import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { ChangeStatusSubmitButtonsComponent } from '~/pages/program-registrations/components/change-status-submit-buttons/change-status-submit-buttons.component';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-change-status-contents-without-message',
  imports: [
    ButtonModule,
    CheckboxModule,
    ReactiveFormsModule,
    FormErrorComponent,
    ChangeStatusSubmitButtonsComponent,
  ],
  templateUrl: './change-status-contents-without-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithoutMessageComponent {
  readonly showAreYouSureCheckbox = input.required<boolean>();
  readonly isMutating = input<boolean>(false);
  readonly cancelChangeStatus = output();
  readonly confirmChangeStatus = output();

  formGroup = new FormGroup({
    confirmAction: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
  });
  formFieldErrors = generateFieldErrors(this.formGroup);

  constructor() {
    effect(() => {
      const confirmActionField = this.formGroup.controls.confirmAction;
      confirmActionField.setValidators([
        this.showAreYouSureCheckbox()
          ? // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
            Validators.requiredTrue
          : // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
            Validators.nullValidator,
      ]);
      confirmActionField.updateValueAndValidity();
    });
  }

  validateFormGroupOrPreventSubmit(event: MouseEvent) {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  cancelClick() {
    this.cancelChangeStatus.emit();
  }
}
