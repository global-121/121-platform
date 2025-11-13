import { inject, Injectable, Signal } from '@angular/core';

import { QueryClient } from '@tanstack/angular-query-experimental';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
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
  private queryClient = inject(QueryClient);

  private notificationApiService = inject(NotificationApiService);
  private programApiService = inject(ProgramApiService);
  private translatableStringService = inject(TranslatableStringService);

  public getMessagePlaceholders(programId: Signal<number | string>) {
    return this.programApiService.getProgramAttributes({
      programId,
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
    programId: Signal<number | string>,
  ): Promise<string | undefined> {
    const sendMessageData = this.getSendMessageData(input);
    if (!sendMessageData) {
      return;
    }

    if ('customMessage' in sendMessageData) {
      return sendMessageData.customMessage;
    }

    const templates = await this.queryClient.fetchQuery(
      this.notificationApiService.getMessageTemplates(programId)(),
    );

    return templates.find(
      (template) => template.type === sendMessageData.messageTemplateKey,
    )?.message;
  }

  public async getMessagePreview({
    input,
    programId,
    previewRegistration,
  }: {
    input: Partial<MessageInputData>;
    programId: Signal<number | string>;
    previewRegistration?: Registration;
  }): Promise<string> {
    const messageText = await this.getMessageText(input, programId);

    if (!messageText) {
      return '';
    }

    const placeholders = await this.queryClient.fetchQuery(
      this.getMessagePlaceholders(programId)(),
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

  public async getTemplateByType({
    type,
    programId,
  }: {
    type?: string;
    programId: Signal<number | string>;
  }) {
    const templates = await this.queryClient.fetchQuery(
      this.notificationApiService.getMessageTemplates(programId)(),
    );
    return templates.find((template) => template.type === type);
  }

  public async getTemplateTypeByRegistrationStatus({
    status,
    programId,
  }: {
    status: RegistrationStatusEnum;
    programId: Signal<number | string>;
  }): Promise<string | undefined> {
    const templates = await this.queryClient.fetchQuery(
      this.notificationApiService.getMessageTemplates(programId)(),
    );
    return templates.find((template) => template.type === status.toLowerCase())
      ?.type;
  }
}
