import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  OnDestroy,
  output,
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
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';

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
import {
  ActionDataWithPaginateQuery,
  IActionDataHandler,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericValidationMessage,
} from '~/utils/form-validation';

type SendMessageFormGroup =
  (typeof SendMessageDialogComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-send-message-dialog',
  imports: [
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    RadioButtonModule,
    SelectModule,
    CustomMessageControlComponent,
    CustomMessagePreviewComponent,
  ],
  providers: [ToastService],
  templateUrl: './send-message-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendMessageDialogComponent
  implements OnDestroy, IActionDataHandler<Registration>
{
  readonly projectId = input.required<string>();
  readonly actionComplete = output();

  private messagingService = inject(MessagingService);
  private notificationApiService = inject(NotificationApiService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  private messageTypeFieldSubscription: Subscription;

  readonly actionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);
  readonly dialogVisible = model<boolean>(false);
  readonly previewData = signal<Partial<MessageInputData> | undefined>(
    undefined,
  );

  messageTemplates = injectQuery(
    this.notificationApiService.getMessageTemplates(this.projectId),
  );

  formGroup = new FormGroup({
    messageType: new FormControl<'custom' | 'template'>('template', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
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
    messageType: genericValidationMessage,
    messageTemplateKey: genericValidationMessage,
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
        showSpinner: true,
      });
      this.actionComplete.emit();
    },
  }));
  constructor() {
    const messageTypeField = this.formGroup.controls.messageType;
    const messageTemplateKeyField = this.formGroup.controls.messageTemplateKey;
    const customMessageField = this.formGroup.controls.customMessage;

    this.messageTypeFieldSubscription = messageTypeField.valueChanges.subscribe(
      (type) => {
        if (type === 'template') {
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          messageTemplateKeyField.setValidators([Validators.required]);
          customMessageField.clearValidators();
        } else {
          customMessageField.setValidators([
            // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
            Validators.required,
            Validators.minLength(20),
          ]);
          messageTemplateKeyField.clearValidators();
        }

        messageTemplateKeyField.updateValueAndValidity();
        customMessageField.updateValueAndValidity();
      },
    );
  }

  triggerAction(actionData: ActionDataWithPaginateQuery<Registration>) {
    this.actionData.set(actionData);
    this.formGroup.reset();
    this.previewData.set(undefined);
    this.dialogVisible.set(true);
  }

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

  ngOnDestroy(): void {
    this.messageTypeFieldSubscription.unsubscribe();
  }
}
