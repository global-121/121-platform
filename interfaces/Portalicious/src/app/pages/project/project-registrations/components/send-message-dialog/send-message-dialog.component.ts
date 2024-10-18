import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

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
  // XXX: make this computed and set to "isPreview"
  messagePreview = signal<string | undefined>(undefined);

  triggerAction(actionData: ActionDataWithPaginateQuery) {
    this.actionData.set(actionData);
    this.reset();
    this.dialogVisible.set(true);
  }

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

  sendMessageMutation = injectMutation(() => ({
    mutationFn: (formValues: SendMessageFormGroup['value']) => {
      const { messageType, customMessage, messageTemplateKey } = formValues;

      let messageData: Parameters<
        RegistrationApiService['sendMessage']
      >[0]['messageData'];

      if (messageType === 'template') {
        if (!messageTemplateKey) {
          return Promise.reject(
            new Error($localize`Please choose a template from the list`),
          );
        }

        messageData = { messageTemplateKey };
      } else {
        if (!customMessage) {
          return Promise.reject(
            new Error($localize`Please insert a custom message`),
          );
        }

        messageData = { customMessage };
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

  private reset() {
    this.formGroup.reset();
    this.messagePreview.set(undefined);
  }

  onProceedToPreview(): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      // XXX: make this work
      return;
    }

    this.messagePreview.set(
      this.formGroup.value.customMessage ?? this.formGroup.value.messageType,
    );
  }

  onFormSubmit(): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    this.sendMessageMutation.mutate(this.formGroup.value);
  }
}
