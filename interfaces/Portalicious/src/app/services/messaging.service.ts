import { inject, Injectable, Signal } from '@angular/core';

import { injectQueryClient } from '@tanstack/angular-query-experimental';

import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import {
  Registration,
  SendMessageData,
} from '~/domains/registration/registration.model';
import { TranslatableStringService } from '~/services/translatable-string.service';

export type MessageInputData =
  | {
      messageType: 'custom';
      customMessage: string;
    }
  | {
      messageType: 'template';
      messageTemplateKey: string;
    };

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  private queryClient = injectQueryClient();

  private notificationApiService = inject(NotificationApiService);
  private projectApiService = inject(ProjectApiService);
  private translatableStringService = inject(TranslatableStringService);

  public getMessagePlaceholders(projectId: Signal<number>) {
    return this.projectApiService.getProjectAttributes({
      projectId,
      // This is the same combo used in the 121-service -> QueueMessageService.getPlaceholdersInMessageText
      includeProgramRegistrationAttributes: true,
      includeTemplateDefaultAttributes: true,
    });
  }

  public getSendMessageData(
    data: Partial<MessageInputData>,
  ): SendMessageData | undefined {
    if (data.messageType === 'template') {
      const { messageTemplateKey } = data;

      if (!messageTemplateKey) {
        return undefined;
      }

      return { messageTemplateKey };
    } else if (data.messageType === 'custom') {
      const { customMessage } = data;

      if (!customMessage) {
        return undefined;
      }

      return { customMessage };
    }

    return;
  }

  private async getMessageText(
    input: Partial<MessageInputData>,
    projectId: Signal<number>,
  ): Promise<string | undefined> {
    const sendMessageData = this.getSendMessageData(input);
    if (!sendMessageData) {
      return;
    }

    if ('customMessage' in sendMessageData) {
      return sendMessageData.customMessage;
    }

    const templates = await this.queryClient.fetchQuery(
      this.notificationApiService.getMessageTemplates(projectId)(),
    );

    return templates.find(
      (template) => template.type === sendMessageData.messageTemplateKey,
    )?.message;
  }

  public async getMessagePreview(
    input: Partial<MessageInputData>,
    projectId: Signal<number>,
    previewRegistration?: Registration,
  ): Promise<string | undefined> {
    const messageText = await this.getMessageText(input, projectId);

    if (!messageText) {
      return;
    }

    const placeholders = await this.queryClient.fetchQuery(
      this.getMessagePlaceholders(projectId)(),
    );

    if (placeholders.length === 0 || !previewRegistration) {
      return messageText;
    }

    return placeholders.reduce((output, attribute) => {
      const translatedAttribute = this.translatableStringService.translate(
        previewRegistration[attribute.name] as
          | LocalizedString
          | number
          | string,
      );

      if (translatedAttribute === undefined) {
        return output;
      }

      return output.replace(
        new RegExp(`{{${attribute.name}}}`, 'g'),
        translatedAttribute,
      );
    }, messageText);
  }
}
