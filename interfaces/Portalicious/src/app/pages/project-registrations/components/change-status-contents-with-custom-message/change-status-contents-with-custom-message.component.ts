import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
  Signal,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { Registration } from '~/domains/registration/registration.model';
import { ChangeStatusFormGroup } from '~/pages/project-registrations/components/change-status-dialog/change-status-dialog.component';
import { CustomMessageControlComponent } from '~/pages/project-registrations/components/custom-message-control/custom-message-control.component';
import { CustomMessagePreviewComponent } from '~/pages/project-registrations/components/custom-message-preview/custom-message-preview.component';
import { MessageInputData } from '~/services/messaging.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

@Component({
  selector: 'app-change-status-contents-with-custom-message',
  standalone: true,
  imports: [
    CustomMessagePreviewComponent,
    CustomMessageControlComponent,
    ButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './change-status-contents-with-custom-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithCustomMessageComponent implements OnInit {
  projectId = input.required<number>();
  formGroup = input.required<ChangeStatusFormGroup>();
  previewRegistration = input.required<Registration | undefined>();
  enableSendMessage = input.required<boolean>();
  isMutating = input<boolean>(false);
  readonly onCancel = output();
  // TODO: This is no bueno
  formFieldErrors: Signal<unknown>;
  previewData = signal<Partial<MessageInputData> | undefined>(undefined);

  ngOnInit(): void {
    this.previewData.set(undefined);
    this.formFieldErrors = generateFieldErrors<ChangeStatusFormGroup>(
      this.formGroup(),
      {
        messageType: genericFieldIsRequiredValidationMessage,
        messageTemplateKey: genericFieldIsRequiredValidationMessage,
        customMessage: (control) => {
          if (control.errors?.required) {
            return $localize`:@@generic-required-field:This field is required.`;
          }
          if (control.errors?.minlength) {
            return $localize`The message must be at least 20 characters long.`;
          }
          return;
        },
      },
    );
  }

  cancelClick() {
    this.previewData.set(undefined);
    this.onCancel.emit();
  }

  onProceedToPreview() {
    this.formGroup().markAllAsTouched();
    if (!this.formGroup().valid) {
      return;
    }
    this.previewData.set(this.formGroup().getRawValue());
  }
}
