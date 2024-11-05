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
  @ViewChild('dryRunWarningDialog')
  private dryRunWarningDialog: ConfirmationDialogComponent;

  actionData = signal<ActionDataWithPaginateQuery<Registration> | undefined>(
    undefined,
  );
  dialogVisible = model<boolean>(false);
  dryRunFailure = model<boolean>(false);
  enableSendMessage = model<boolean>(false);
  customMessage = model<string>();
  previewData = signal<Partial<MessageInputData> | undefined>(undefined);
  status = signal<RegistrationStatusEnum | undefined>(undefined);
  messageTemplates = injectQuery(
    this.notificationApiService.getMessageTemplates(this.projectId),
  );
  foundTemplateKey = signal<string | undefined>(undefined);
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
          this.enableSendMessage.set(false);
          this.previewData.set(undefined);
        } else {
          this.foundTemplateKey.set(foundMessageTemplate.type);

          this.enableSendMessage.set(false);
          this.previewData.set(this.getSendMessageData());
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

  getSendMessageInputData(): Partial<MessageInputData> {
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
  }

  private getSendMessageData(): SendMessageData | undefined {
    if (!this.enableSendMessage()) {
      return undefined;
    }

    const messageInputData = this.getSendMessageInputData();
    return this.messagingService.getSendMessageData(messageInputData);
  }

  changeStatusMutation = injectMutation(() => ({
    mutationFn: ({ dryRun }: { dryRun: boolean }) => {
      const messageData = this.getSendMessageData();

      return this.registrationApiService.changeStatus({
        projectId: this.projectId,
        paginateQuery: this.actionData()?.query,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        status: this.status()!,
        messageData,
        dryRun,
      });
    },
    onSuccess: (data, variables) => {
      // decide which dialog to show based on count
      if (data.nonApplicableCount === 0) {
        if (variables.dryRun) {
          this.changeStatusMutation.mutate({ dryRun: false });
          return;
        }
        this.dialogVisible.set(false);
        this.toastService.showToast({
          summary: $localize`Success`,
          detail: $localize`${data.applicableCount} registration(s) were ${this.statusVerb().toLowerCase()} successfully. The status change can take up to a minute to process.`,
          severity: 'success',
        });
        void this.registrationApiService.invalidateCache(this.projectId);
        return;
      }

      if (data.applicableCount === 0) {
        this.dialogVisible.set(false);
        this.dryRunFailure.set(true);
        return;
      }

      this.dialogVisible.set(false);
      this.dryRunWarningDialog.askForConfirmation({
        resetMutation: false,
      });
    },
  }));

  onFormSubmit(): void {
    this.changeStatusMutation.mutate({ dryRun: true });
  }
}
