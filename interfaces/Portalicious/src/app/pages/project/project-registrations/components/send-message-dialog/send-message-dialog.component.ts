import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { uniqBy } from 'lodash';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { NotificationApiService } from '~/domains/notification/notification.api.service';
import {
  RegistrationApiService,
  SendMessageData,
} from '~/domains/registration/registration.api.service';
import { CustomMessageControlComponent } from '~/pages/project/project-registrations/components/custom-message-control/custom-message-control.component';
import { CustomMessagePreviewComponent } from '~/pages/project/project-registrations/components/custom-message-preview/custom-message-preview.component';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
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
  projectId = input.required<number>();

  private notificationApiService = inject(NotificationApiService);
  private registrationApiService = inject(RegistrationApiService);
  private translatableStringService = inject(TranslatableStringService);
  private toastService = inject(ToastService);

  actionData = signal<ActionDataWithPaginateQuery | undefined>(undefined);
  dialogVisible = model<boolean>(false);
  previewData = signal<SendMessageData | undefined>(undefined);

  messageTemplates = injectQuery(
    this.notificationApiService.getMessageTemplates(this.projectId),
  );

  messageTemplateOptions = computed(() => {
    if (!this.messageTemplates.isSuccess()) {
      return [];
    }

    return uniqBy(
      this.messageTemplates
        .data()
        .filter((template) => template.isSendMessageTemplate)
        .map((template) => {
          return {
            label:
              this.translatableStringService.translate(template.label) ??
              $localize`<UNNAMED TEMPLATE>`,
            value: template.type,
          };
        }),
      'value',
    ).sort((a, b) => a.label.localeCompare(b.label));
  });

  formGroup = new FormGroup({
    messageType: new FormControl<'custom' | 'template'>('template', {
      nonNullable: true,
    }),
    messageTemplateKey: new FormControl<string | undefined>(undefined),
    customMessage: new FormControl<string | undefined>(undefined),
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

  private getSendMessageData(
    formValues: SendMessageFormGroup['value'],
  ): SendMessageData | undefined {
    const { messageType, customMessage, messageTemplateKey } = formValues;

    if (messageType === 'template') {
      if (!messageTemplateKey) {
        return;
      }

      return { messageTemplateKey };
    }

    if (!customMessage) {
      return;
    }

    return { customMessage };
  }

  sendMessageMutation = injectMutation(() => ({
    mutationFn: (formValues: SendMessageFormGroup['value']) => {
      const messageData = this.getSendMessageData(formValues);

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

  onProceedToPreview(): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    this.previewData.set(this.getSendMessageData(this.formGroup.value));
  }

  onFormSubmit(): void {
    this.sendMessageMutation.mutate(this.formGroup.value);
  }
}
