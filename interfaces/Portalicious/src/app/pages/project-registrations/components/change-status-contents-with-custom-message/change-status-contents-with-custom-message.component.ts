import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { Registration } from '~/domains/registration/registration.model';
import { ChangeStatusSubmitButtonsComponent } from '~/pages/project-registrations/components/change-status-submit-buttons/change-status-submit-buttons.component';
import { CustomMessageControlComponent } from '~/pages/project-registrations/components/custom-message-control/custom-message-control.component';
import { CustomMessagePreviewComponent } from '~/pages/project-registrations/components/custom-message-preview/custom-message-preview.component';
import { MessageInputData } from '~/services/messaging.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-change-status-contents-with-custom-message',
  standalone: true,
  imports: [
    CustomMessagePreviewComponent,
    CustomMessageControlComponent,
    ButtonModule,
    ReactiveFormsModule,
    ChangeStatusSubmitButtonsComponent,
  ],
  templateUrl: './change-status-contents-with-custom-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithCustomMessageComponent implements OnInit {
  projectId = input.required<number>();
  previewRegistration = input.required<Registration | undefined>();
  enableSendMessage = input.required<boolean>();
  isMutating = input<boolean>(false);
  readonly cancelChangeStatus = output();
  readonly customMessageUpdated = output<string>();

  formGroup = new FormGroup({
    customMessage: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method
        Validators.required,
        Validators.minLength(20),
      ],
    }),
  });
  previewData = signal<Partial<MessageInputData> | undefined>(undefined);
  formFieldErrors = generateFieldErrors(this.formGroup, {
    customMessage: (control) => {
      if (control.errors?.required) {
        return $localize`:@@generic-required-field:This field is required.`;
      }

      if (control.errors?.minlength) {
        return $localize`The message must be at least 20 characters long.`;
      }
      return;
    },
  });

  ngOnInit(): void {
    this.previewData.set(undefined);
  }

  cancelClick() {
    this.cancelChangeStatus.emit();
  }

  onProceedToPreview() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid || !this.formGroup.value.customMessage) {
      return;
    }
    this.previewData.set({
      messageType: 'custom',
      customMessage: this.formGroup.value.customMessage,
    });
    this.customMessageUpdated.emit(this.formGroup.value.customMessage);
  }
}
