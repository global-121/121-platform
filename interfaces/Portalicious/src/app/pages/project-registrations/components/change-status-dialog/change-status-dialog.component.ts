import { LowerCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
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
import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  REGISTRATION_STATUS_ICON,
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
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
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
export class ChangeStatusDialogComponent {
  projectId = input.required<number>();
  RegistrationStatusEnum = RegistrationStatusEnum;

  private messagingService = inject(MessagingService);
  private notificationApiService = inject(NotificationApiService);
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
  foundTemplateKey = signal<string | undefined>(undefined);

  messageTemplates = injectQuery(
    this.notificationApiService.getMessageTemplates(this.projectId),
  );
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
          this.foundTemplateKey.set(undefined);
          this.enableSendMessage.set(false);
        } else {
          this.foundTemplateKey.set(foundMessageTemplate.type);
          this.enableSendMessage.set(false);
        }
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

  sendMessageInputData = computed<Partial<MessageInputData>>(() => {
    const foundTemplateKey = this.foundTemplateKey();

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
          summary: $localize`:@@generic-success:Success`,
          detail: $localize`${data.applicableCount} registration(s) were ${this.statusVerb().toLowerCase()} successfully. The status change can take up to a minute to process.`,
          severity: 'success',
        });
        void this.registrationApiService.invalidateCache(this.projectId);
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
