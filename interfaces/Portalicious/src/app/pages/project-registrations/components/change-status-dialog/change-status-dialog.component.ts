import { LowerCasePipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
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
import { InputSwitchModule } from 'primeng/inputswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SkeletonModule } from 'primeng/skeleton';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  REGISTRATION_STATUS_ICON,
  REGISTRATION_STATUS_VERB,
} from '~/domains/registration/registration.helper';
import {
  Registration,
  SendMessageData,
} from '~/domains/registration/registration.model';
import { ChangeStatusContentsWithCustomMessageComponent } from '~/pages/project-registrations/components/change-status-contents-with-custom-message/change-status-contents-with-custom-message.component';
import { ChangeStatusContentsWithTemplatedMessageComponent } from '~/pages/project-registrations/components/change-status-contents-with-templated-message/change-status-contents-with-templated-message.component';
import { ChangeStatusContentsWithoutMessageComponent } from '~/pages/project-registrations/components/change-status-contents-without-message/change-status-contents-without-message.component';
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

export type ChangeStatusFormGroup =
  (typeof ChangeStatusDialogComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-change-status-dialog',
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
    InputSwitchModule,
    NgTemplateOutlet,
    SkeletonModule,
    ConfirmationDialogComponent,
    ChangeStatusContentsWithoutMessageComponent,
    ChangeStatusContentsWithTemplatedMessageComponent,
    ChangeStatusContentsWithCustomMessageComponent,
    FormsModule,
    LowerCasePipe,
  ],
  providers: [ToastService],
  templateUrl: './change-status-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusDialogComponent {
  projectId = input.required<number>();
  RegistrationStatusEnum = RegistrationStatusEnum;

  private messagingService = inject(MessagingService);
  private notificationApiService = inject(NotificationApiService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  actionData = signal<ActionDataWithPaginateQuery<Registration> | undefined>(
    undefined,
  );
  dialogVisible = model<boolean>(false);
  enableSendMessage = model<boolean>(false);
  previewData = signal<Partial<MessageInputData> | undefined>(undefined);
  status = signal<RegistrationStatusEnum | undefined>(undefined);
  messageTemplates = injectQuery(
    this.notificationApiService.getMessageTemplates(this.projectId),
  );
  hasTemplate = signal<boolean>(false);
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
  formFieldErrors = generateFieldErrors<ChangeStatusFormGroup>(this.formGroup, {
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
  icon = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_STATUS_ICON[status];
  });
  statusVerb = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_STATUS_VERB[status];
  });
  canSendMessage = computed(() => {
    const status = this.status();
    if (!status) {
      return false;
    }
    const statusesWithSendMessageEnabled = [
      RegistrationStatusEnum.included,
      RegistrationStatusEnum.paused,
      RegistrationStatusEnum.declined,
    ];
    return statusesWithSendMessageEnabled.includes(status);
  });

  constructor() {
    const messageTemplateKeyField = this.formGroup.controls.messageTemplateKey;
    const customMessageField = this.formGroup.controls.customMessage;
    effect(
      () => {
        const status = this.status();
        if (!this.messageTemplates.isSuccess() || !status) {
          return;
        }
        const foundMessageTemplate = this.messageTemplates
          .data()
          .find((template) => template.type === status.toLowerCase());

        if (!foundMessageTemplate) {
          this.hasTemplate.set(false);
          customMessageField.setValidators([
            // eslint-disable-next-line @typescript-eslint/unbound-method
            Validators.required,
            Validators.minLength(20),
          ]);
          messageTemplateKeyField.clearValidators();
          this.formGroup.reset({
            messageType: 'custom',
            messageTemplateKey: undefined,
            customMessage: undefined,
          });
          this.enableSendMessage.set(false);
          this.previewData.set(undefined);
        } else {
          this.hasTemplate.set(true);
          // eslint-disable-next-line @typescript-eslint/unbound-method
          messageTemplateKeyField.setValidators([Validators.required]);
          customMessageField.clearValidators();
          this.formGroup.reset({
            messageType: 'template',
            messageTemplateKey: foundMessageTemplate.type,
            customMessage: undefined,
          });
          this.enableSendMessage.set(false);
          this.previewData.set(this.formGroup.getRawValue());
        }
        messageTemplateKeyField.updateValueAndValidity();
        customMessageField.updateValueAndValidity();
      },
      {
        allowSignalWrites: true,
      },
    );
  }

  triggerAction(
    actionData: ActionDataWithPaginateQuery<Registration>,
    status: RegistrationStatusEnum,
  ) {
    this.actionData.set(actionData);
    // Doing this to trigger the effect
    this.status.set(undefined);
    this.status.set(status);

    this.dialogVisible.set(true);
  }

  private getSendMessageData(
    formValues: ReturnType<ChangeStatusFormGroup['getRawValue']>,
  ): SendMessageData | undefined {
    return this.messagingService.getSendMessageData(formValues);
  }

  changeStatusMutation = injectMutation(() => ({
    mutationFn: ({ dryRun }: { dryRun: boolean }) => {
      const formValues = this.formGroup.getRawValue();
      const messageData = this.getSendMessageData(formValues);

      return this.registrationApiService.changeStatus({
        projectId: this.projectId,
        paginateQuery: this.actionData()?.query,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        status: this.status()!,
        messageData,
        dryRun,
      });
    },
    onError: () => {
      // TODO: AB#30987 Should not happen, lets show error dialog anyway
    },
    onSuccess: (data) => {
      // decide which dialog to show based on count
      if (data.nonApplicableCount === 0) {
        this.dialogVisible.set(false);
        this.toastService.showToast({
          summary: $localize`Success`,
          detail: $localize`${data.applicableCount} registration(s) were ${this.status()?.toLowerCase()} successfully.`,
          severity: 'success',
        });
      } else {
        if (data.applicableCount === 0) {
          // TODO: AB#30987 Show error, not applicable to anyone
          // this.dryRunFailure.set(true);
        } else {
          // TODO: AB#30987 Show warning, only applicable to <applicableCount>
          // this.dryRunWarningDialog.askForConfirmation();
        }
      }
    },
  }));

  onProceedToPreview(): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    this.previewData.set(this.formGroup.getRawValue());
  }

  onFormSubmit(event?: unknown): void {
    console.log(
      '🚀 ~ ChangeStatusDialogComponent ~ onFormSubmit ~ event:',
      event,
    );
    this.changeStatusMutation.mutate({ dryRun: true });
  }
}
