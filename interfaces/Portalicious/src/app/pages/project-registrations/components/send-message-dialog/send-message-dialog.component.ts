import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { CustomMessageControlComponent } from '~/pages/project-registrations/components/custom-message-control/custom-message-control.component';
import { CustomMessagePreviewComponent } from '~/pages/project-registrations/components/custom-message-preview/custom-message-preview.component';
import {
  MessageInputData,
  MessagingService,
} from '~/services/messaging.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type SendMessageFormGroup =
  (typeof SendMessageDialogComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-send-message-dialog',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    RadioButtonModule,
    DropdownModule,
    CustomMessageControlComponent,
    CustomMessagePreviewComponent,
  ],
  providers: [ToastService],
  templateUrl: './send-message-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendMessageDialogComponent {
  readonly projectId = input.required<number>();
  readonly previewRegistration = input.required<Registration>();

  private messagingService = inject(MessagingService);
  private notificationApiService = inject(NotificationApiService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  actionData = signal<ActionDataWithPaginateQuery | undefined>(undefined);
  dialogVisible = model<boolean>(false);
  previewData = signal<Partial<MessageInputData> | undefined>(undefined);

  messageTemplates = injectQuery(
    this.notificationApiService.getMessageTemplates(this.projectId),
  );

  formGroup = new FormGroup({
    messageType: new FormControl<'custom' | 'template'>('template', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
    }),
    messageTemplateKey: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    customMessage: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors<SendMessageFormGroup>(this.formGroup, {
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
  });

  constructor() {
    const messageTypeField = this.formGroup.controls.messageType;
    const messageTemplateKeyField = this.formGroup.controls.messageTemplateKey;
    const customMessageField = this.formGroup.controls.customMessage;

    messageTypeField.valueChanges.subscribe((type) => {
      if (type === 'template') {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        messageTemplateKeyField.setValidators([Validators.required]);
        customMessageField.clearValidators();
      } else {
        customMessageField.setValidators([
          // eslint-disable-next-line @typescript-eslint/unbound-method
          Validators.required,
          Validators.minLength(20),
        ]);
        messageTemplateKeyField.clearValidators();
      }

      messageTemplateKeyField.updateValueAndValidity();
      customMessageField.updateValueAndValidity();
    });
  }

  triggerAction(actionData: ActionDataWithPaginateQuery) {
    this.actionData.set(actionData);
    this.formGroup.reset();
    this.previewData.set(undefined);
    this.dialogVisible.set(true);
  }

  sendMessageMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<SendMessageFormGroup['getRawValue']>,
    ) => {
      const messageData = this.messagingService.getSendMessageData(formValues);

      if (!messageData) {
        // should never happen, but makes TS happy
        this.toastService.showGenericError();
        console.error('Invalid message data', formValues);
        throw new Error('Invalid message data');
      }

      return this.registrationApiService.sendMessage({
        projectId: this.projectId,
        paginateQuery: this.actionData()?.query,
        messageData,
      });
    },
    onSuccess: () => {
      this.dialogVisible.set(false);
      this.toastService.showToast({
        summary: $localize`Sending messages`,
        detail: $localize`Use the 'Last Message Status' column to check the progress of messages.

        Closing this notification will not cancel message sending.`,
        severity: 'info',
      });
    },
  }));

  onProceedToPreview() {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      return;
    }

    this.previewData.set(this.formGroup.getRawValue());
  }

  onFormSubmit(): void {
    this.sendMessageMutation.mutate(this.formGroup.getRawValue());
  }
}
