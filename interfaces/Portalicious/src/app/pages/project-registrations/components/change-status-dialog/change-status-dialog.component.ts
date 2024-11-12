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
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  REGISTRATION_STATUS_ICON,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_VERB,
} from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import { ChangeStatusContentsWithCustomMessageComponent } from '~/pages/project-registrations/components/change-status-contents-with-custom-message/change-status-contents-with-custom-message.component';
import { ChangeStatusContentsWithTemplatedMessageComponent } from '~/pages/project-registrations/components/change-status-contents-with-templated-message/change-status-contents-with-templated-message.component';
import { ChangeStatusContentsWithoutMessageComponent } from '~/pages/project-registrations/components/change-status-contents-without-message/change-status-contents-without-message.component';
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
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    RadioButtonModule,
    DropdownModule,
    InputSwitchModule,
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
export class ChangeStatusDialogComponent
  implements IActionDataHandler<Registration>
{
  projectId = input.required<number>();
  readonly onActionComplete = output();

  RegistrationStatusEnum = RegistrationStatusEnum;

  private messagingService = inject(MessagingService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  @ViewChild('dryRunWarningDialog')
  private dryRunWarningDialog: ConfirmationDialogComponent;

  actionData = signal<ActionDataWithPaginateQuery<Registration> | undefined>(
    undefined,
  );
  dialogVisible = model<boolean>(false);
  dryRunFailureDialogVisible = model<boolean>(false);
  enableSendMessage = model<boolean>(false);
  customMessage = model<string>();
  status = signal<RegistrationStatusEnum | undefined>(undefined);

  icon = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_STATUS_ICON[status];
  });
  statusLabel = computed(() => {
    const status = this.status();
    if (!status) {
      return '';
    }
    return REGISTRATION_STATUS_LABELS[status];
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

  triggerAction(
    actionData: ActionDataWithPaginateQuery<Registration>,
    status: RegistrationStatusEnum,
  ) {
    this.actionData.set(actionData);
    this.status.set(status);

    this.dialogVisible.set(true);
    this.enableSendMessage.set(false);
  }

  messageTemplateKey = injectQuery(() => ({
    queryKey: ['change-status-template-key', this.status(), this.projectId()],
    queryFn: () => {
      const status = this.status();
      if (!status) {
        return;
      }
      return this.messagingService.getTemplateTypeByRegistrationStatus({
        status,
        projectId: this.projectId,
      });
    },
  }));

  sendMessageInputData = computed<Partial<MessageInputData>>(() => {
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

  changeStatusMutation = injectMutation(() => ({
    mutationFn: ({ dryRun }: { dryRun: boolean }) => {
      const status = this.status();
      if (!status) {
        throw new Error('Status is undefined.');
      }
      const messageData = this.messagingService.getSendMessageData(
        this.sendMessageInputData(),
      );

      return this.registrationApiService.changeStatus({
        projectId: this.projectId,
        paginateQuery: this.actionData()?.query,
        status,
        messageData,
        dryRun,
      });
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
        this.onActionComplete.emit();
        void this.registrationApiService.invalidateCache(this.projectId);

        setTimeout(() => {
          // invalidate the cache again after a delay to try and make the status change reflected in the UI
          void this.registrationApiService.invalidateCache(this.projectId);
        }, 3000);
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
      this.dryRunWarningDialog.askForConfirmation({
        resetMutation: false,
      });
    },
  }));

  onFormSubmit(): void {
    this.changeStatusMutation.mutate({ dryRun: true });
  }

  onChangeStatusCancel() {
    this.dialogVisible.set(false);
    this.changeStatusMutation.reset();
  }
}
