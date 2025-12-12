import { LowerCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  REGISTRATION_STATUS_ICON,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_VERB,
} from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import { ChangeStatusContentsWithCustomMessageComponent } from '~/pages/program-registrations/components/change-status-contents-with-custom-message/change-status-contents-with-custom-message.component';
import { ChangeStatusContentsWithTemplatedMessageComponent } from '~/pages/program-registrations/components/change-status-contents-with-templated-message/change-status-contents-with-templated-message.component';
import { ChangeStatusContentsWithoutMessageComponent } from '~/pages/program-registrations/components/change-status-contents-without-message/change-status-contents-without-message.component';
import { ChangeStatusReasonComponent } from '~/pages/program-registrations/components/change-status-reason/change-status-reason.component';
import {
  MessageInputData,
  MessagingService,
} from '~/services/messaging.service';
import {
  ActionDataWithPaginateQuery,
  IActionDataHandler,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-change-status-dialog',
  imports: [
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    RadioButtonModule,
    ToggleSwitchModule,
    SkeletonModule,
    FormDialogComponent,
    ChangeStatusContentsWithoutMessageComponent,
    ChangeStatusContentsWithTemplatedMessageComponent,
    ChangeStatusContentsWithCustomMessageComponent,
    ChangeStatusReasonComponent,
    FormsModule,
    LowerCasePipe,
  ],
  providers: [ToastService],
  templateUrl: './change-status-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusDialogComponent
  implements IActionDataHandler<Registration>
{
  readonly programId = input.required<string>();
  readonly actionComplete = output();

  RegistrationStatusEnum = RegistrationStatusEnum;

  private messagingService = inject(MessagingService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  readonly dryRunWarningDialog = viewChild.required<FormDialogComponent>(
    'dryRunWarningDialog',
  );

  readonly actionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);
  readonly dialogVisible = model<boolean>(false);
  readonly dryRunFailureDialogVisible = model<boolean>(false);
  readonly enableSendMessage = model<boolean>(false);
  readonly customMessage = model<string>();
  readonly status = signal<RegistrationStatusEnum | undefined>(undefined);

  readonly reason = model<string | undefined>(undefined);
  readonly reasonValidationErrorMessage = signal<string | undefined>(undefined);

  readonly icon = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_STATUS_ICON[status];
  });
  readonly statusLabel = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_STATUS_LABELS[status];
  });
  readonly statusVerb = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_STATUS_VERB[status];
  });
  readonly changeStatusWarningMessage = computed(() => {
    switch (this.status()) {
      case RegistrationStatusEnum.validated:
        return $localize`:@@change-status-validate-warning:The action "Validate" can only be applied to registrations with the "New" status.`;
      case RegistrationStatusEnum.included:
        return $localize`:@@change-status-include-warning:The action "Include" can only be applied to registrations that do not have status "Included" and whose “Payments left” is larger than 0.`;
      case RegistrationStatusEnum.paused:
        return $localize`:@@change-status-pause-warning:The action "Pause" can only be applied to registrations with the "Included" status.`;
      case RegistrationStatusEnum.declined:
        return $localize`:@@change-status-decline-warning:The action "Decline" can not be applied to registrations with the "Declined" or "Completed" status.`;
      case RegistrationStatusEnum.deleted:
        return $localize`:@@change-status-delete-warning:The action "Delete" can not be applied to registrations with the "Completed" status.`;
      default:
        return $localize`:@@change-status-default-warning:This action can not be applied to registrations you have selected.`;
    }
  });
  readonly canSendMessage = computed(() => {
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
  readonly reasonIsRequired = computed(() => {
    const status = this.status();
    if (!status) {
      return false;
    }
    const statusesForWhichReasonIsRequired = [
      RegistrationStatusEnum.declined,
      RegistrationStatusEnum.paused,
      RegistrationStatusEnum.deleted,
    ];
    return statusesForWhichReasonIsRequired.includes(status);
  });

  readonly sendMessageInputData = computed<Partial<MessageInputData>>(() => {
    const foundTemplateKey = this.messageTemplateKey.data();

    if (foundTemplateKey) {
      return {
        messageType: 'template',
        messageTemplateKey: foundTemplateKey,
      };
    }

    return {
      messageType: 'custom',
      customMessage: this.customMessage(),
    };
  });

  messageTemplateKey = injectQuery(() => ({
    queryKey: ['change-status-template-key', this.status(), this.programId()],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed by enabled
      const status = this.status()!;
      return (
        (await this.messagingService.getTemplateTypeByRegistrationStatus({
          status,
          programId: this.programId,
        })) ?? ''
      );
    },
    enabled: !!this.status(),
  }));

  changeStatusMutation = injectMutation(() => ({
    mutationFn: ({ dryRun }: { dryRun: boolean }) => {
      const status = this.status();
      if (!status) {
        throw new Error('Status is undefined.');
      }

      const messageData = this.enableSendMessage()
        ? this.messagingService.getSendMessageData(this.sendMessageInputData())
        : undefined;

      return this.registrationApiService.changeStatus({
        programId: this.programId,
        paginateQuery: this.actionData()?.query,
        status,
        reason: this.reason(),
        messageData,
        dryRun,
      });
    },
    meta: {
      invalidateCacheAgainAfterDelay: 500,
    },
    onSuccess: (data, variables) => {
      if (data.nonApplicableCount === 0) {
        // case #1: the change can be applied to all registrations
        if (variables.dryRun) {
          this.changeStatusMutation.mutate({ dryRun: false });
          return;
        }
        this.dialogVisible.set(false);
        this.toastService.showToast({
          summary: $localize`Changing statuses`,
          detail: $localize`The status of ${data.applicableCount} registration(s) is being changed to "${this.statusLabel()}" successfully. The status change can take up to a minute to process.`,
          severity: 'info',
          showSpinner: true,
        });
        this.actionComplete.emit();
        return;
      }

      if (data.applicableCount === 0) {
        // case #2: the change can be applied to none of the registrations
        this.dialogVisible.set(false);
        this.dryRunFailureDialogVisible.set(true);
        return;
      }

      // case #3: the change can be applied to only some of the registrations
      this.dialogVisible.set(false);
      this.dryRunWarningDialog().show({
        resetMutation: false,
      });
    },
  }));

  triggerAction(
    actionData: ActionDataWithPaginateQuery<Registration>,
    status: RegistrationStatusEnum,
  ) {
    this.actionData.set(actionData);
    this.status.set(status);

    this.dialogVisible.set(true);
    this.enableSendMessage.set(false);
  }

  onFormSubmit(): void {
    if (this.reasonIsRequired() && !this.reason()) {
      this.reasonValidationErrorMessage.set(
        $localize`:@@generic-required-field:This field is required.`,
      );
      return;
    }
    this.changeStatusMutation.mutate({ dryRun: true });
  }

  onKeyboardSubmit(): void {
    // Prevent "Enter"-key from submitting for 'sensitive' status changes like "Delete";
    // Only as a quick workaround, before we have properly refactored several dialogs and their form-validation-logic. See AB#39194
    if (this.status() === RegistrationStatusEnum.deleted) {
      return;
    }

    this.onFormSubmit();
  }

  onChangeStatusCancel() {
    this.dialogVisible.set(false);
    this.changeStatusMutation.reset();

    // Manual reset the input that might already be given;
    // These steps are only necessary while they're not properly part of a FormGroup that can reset on close of the dialog
    // See AB#39194
    this.reason.set(undefined);
    this.reasonValidationErrorMessage.set(undefined);
    this.enableSendMessage.set(false);
    this.customMessage.set(undefined);
  }
}
