import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-change-status-reason',
  imports: [
    ButtonModule,
    FormsModule,
    CommonModule,
    FormFieldWrapperComponent,
    InputTextModule,
  ],
  templateUrl: './change-status-reason.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusReasonComponent {
  RegistrationStatusEnum = RegistrationStatusEnum;

  readonly status = input.required<RegistrationStatusEnum>();
  readonly reason = model.required<string | undefined>();
  readonly reasonValidationErrorMessage = input<string | undefined>();

  readonly reasonUpdated = output();
}
