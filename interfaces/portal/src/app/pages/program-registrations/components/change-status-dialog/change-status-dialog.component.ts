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
  getChangeStatusWarningMessage,
  getRegistrationUpdateDialogSubmitLabel,
  REGISTRATION_STATUS_ICON,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_PENDING_APPROVAL_EXPLANATION,
  REGISTRATION_STATUS_VERB,
} from '~/domains/registration/registration.helper';
import {
  ChangeStatusResult,
  Registration,
} from '~/domains/registration/registration.model';
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
export class ChangeStatusDialogComponent implements IActionDataHandler<Registration> {
  readonly RegistrationStatusEnum = RegistrationStatusEnum;

  readonly programId = input.required<string>();
  readonly actionComplete = output();

  private messagingService = inject(MessagingService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  readonly dryRunWarningDialog = viewChild.required<FormDialogComponent>(
    'dryRunWarningDialog',
  );

  readonly actionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);
  readonly dialogVisible = model(false);
  readonly dryRunFailureDialogVisible = model(false);
  readonly enableSendMessage = model(false);
  readonly customMessage = model<string>();
  readonly status = signal<RegistrationStatusEnum | undefined>(undefined);

  readonly reason = model<string | undefined>(undefined);
  readonly reasonValidationErrorMessage = signal<string | undefined>(undefined);

  // Snapshot of the dry-run result so the warning dialog stays stable while the real mutation is in flight
  readonly dryRunPreviewData = signal<ChangeStatusResult | undefined>(
    undefined,
  );

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

  readonly pendingApprovalExplanation = computed(() => {
    const status = this.status();
    if (!status) {
      return undefined;
    }
    return REGISTRATION_STATUS_PENDING_APPROVAL_EXPLANATION[status];
  });

  readonly submitButtonText = computed(() => {
    return getRegistrationUpdateDialogSubmitLabel({
      status: this.status(),
      count: this.actionData()?.count,
    });
  });

  readonly changeStatusWarningMessage = computed(() => {
    return getChangeStatusWarningMessage({ status: this.status() });
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
      if (!variables.dryRun) {
        this.onStatusChangeApplied({ data });
        return;
      }

      this.handleDryRunResult({ data });
    },
  }));

  private onStatusChangeApplied({ data }: { data: ChangeStatusResult }): void {
    this.toastService.showToast({
      summary: $localize`Changing statuses`,
      detail: $localize`The status of ${data.applicableCount} registration(s) is being changed to "${this.statusLabel()}" successfully. The status change can take up to a minute to process.`,
      severity: 'info',
      showSpinner: true,
    });

    this.resetDialogState();
    this.actionComplete.emit();
  }

  private handleDryRunResult({ data }: { data: ChangeStatusResult }): void {
    const hasBlockingRegistrations =
      data.nonApplicableCount > 0 || (data.pendingApprovalCount ?? 0) > 0;

    if (!hasBlockingRegistrations) {
      this.changeStatusMutation.mutate({ dryRun: false });
      return;
    }

    this.dialogVisible.set(false);

    if (data.applicableCount === 0) {
      this.dryRunFailureDialogVisible.set(true);
      return;
    }

    this.dryRunPreviewData.set(data);
    this.dryRunWarningDialog().show({ resetMutation: false });
  }

  triggerAction(
    actionData: ActionDataWithPaginateQuery<Registration>,
    status: RegistrationStatusEnum,
  ) {
    this.actionData.set(actionData);
    this.status.set(status);
    this.dryRunPreviewData.set(undefined);
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
    this.changeStatusMutation.reset();

    // Manual reset the input that might already be given;
    // These steps are only necessary while they're not properly part of a FormGroup that can reset on close of the dialog
    // See AB#39194
    this.resetDialogState();
  }

  private resetDialogState() {
    this.dialogVisible.set(false);
    this.reason.set(undefined);
    this.reasonValidationErrorMessage.set(undefined);
    this.enableSendMessage.set(false);
    this.customMessage.set(undefined);
    this.dryRunPreviewData.set(undefined);
  }
}
