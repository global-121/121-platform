import { NgTemplateOutlet } from '@angular/common';
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

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  Registration,
  SendMessageData,
} from '~/domains/registration/registration.model';
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

type ChangeStatusFormGroup =
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
  ],
  providers: [ToastService],
  templateUrl: './change-status-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusDialogComponent {
  projectId = input.required<number>();

  private messagingService = inject(MessagingService);
  private notificationApiService = inject(NotificationApiService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  actionData = signal<ActionDataWithPaginateQuery<Registration> | undefined>(
    undefined,
  );
  dialogVisible = model<boolean>(false);
  previewData = signal<Partial<MessageInputData> | undefined>(undefined);
  status = signal<RegistrationStatusEnum | undefined>(undefined);
  messageTemplates = injectQuery(
    this.notificationApiService.getMessageTemplates(this.projectId),
  );

  formGroup = new FormGroup({
    enableSendMessage: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enableSendMessage: (_control) => {
      return undefined;
    },
  });

  icon = computed(() => {
    // ##TODO: add this to a helper to reuse this for the registrations page
    const status = this.status();
    if (!status) {
      return '';
    }
    const iconMap = {
      [RegistrationStatusEnum.registered]: 'pi-TODO',
      [RegistrationStatusEnum.completed]: 'pi-TODO',
      [RegistrationStatusEnum.validated]: 'pi-check-circle',
      [RegistrationStatusEnum.included]: 'pi-check',
      [RegistrationStatusEnum.paused]: 'pi-pause',
      [RegistrationStatusEnum.declined]: 'pi-times',
      [RegistrationStatusEnum.deleted]: 'pi-trash',
    };
    return iconMap[status];
  });
  headerText = computed(() => {
    // ##TODO: add this to a helper to reuse this for the registrations page
    const status = this.status();
    if (!status) {
      return '';
    }
    const textMap = {
      [RegistrationStatusEnum.registered]: $localize`Register`,
      [RegistrationStatusEnum.completed]: $localize`Complete`,
      [RegistrationStatusEnum.validated]: $localize`Validate`,
      [RegistrationStatusEnum.included]: $localize`Include`,
      [RegistrationStatusEnum.paused]: $localize`Pause`,
      [RegistrationStatusEnum.declined]: $localize`Decline`,
      [RegistrationStatusEnum.deleted]: $localize`Delete`,
    };
    return textMap[status];
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
    const messageTypeField = this.formGroup.controls.messageType;
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
          messageTypeField.setValue('custom');
          messageTemplateKeyField.setValue(undefined);
          customMessageField.setValue(undefined);
          this.previewData.set(undefined);
          return;
        }

        messageTypeField.setValue('template');
        messageTemplateKeyField.setValue(foundMessageTemplate.type);
        customMessageField.setValue(undefined);
        this.previewData.set(this.formGroup.getRawValue());
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
    this.formGroup.reset();

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
    mutationFn: (
      formValues: ReturnType<ChangeStatusFormGroup['getRawValue']>,
    ) => {
      const messageData = this.getSendMessageData(formValues);

      return this.registrationApiService.changeStatus({
        projectId: this.projectId,
        paginateQuery: this.actionData()?.query,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        status: this.status()!,
        messageData,
      });
    },
    onSuccess: () => {
      this.dialogVisible.set(false);
      this.toastService.showToast({
        summary: $localize`Success`,
        detail: $localize`Use the 'Last Message Status' column to check the progress of messages.

        Closing this notification will not cancel message sending.`,
        severity: 'success',
      });
    },
  }));

  onProceedToPreview(): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    this.previewData.set(this.formGroup.getRawValue());
  }

  onFormSubmit(): void {
    this.changeStatusMutation.mutate(this.formGroup.getRawValue());
  }
}
