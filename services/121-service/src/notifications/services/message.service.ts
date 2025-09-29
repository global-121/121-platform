import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import {
  MessageJobCustomDataDto,
  MessageJobDto,
  MessageProcessType,
} from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { SmsService } from '@121-service/src/notifications/sms/sms.service';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappService } from '@121-service/src/notifications/whatsapp/whatsapp.service';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class MessageService {
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(RegistrationEntity)
  public readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(WhatsappPendingMessageEntity)
  private readonly whatsappPendingMessageRepo: Repository<WhatsappPendingMessageEntity>;
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepo: Repository<MessageTemplateEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly whatsappService: WhatsappService,
    private readonly smsService: SmsService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly azureLogService: AzureLogService,
  ) {}

  public async sendTextMessage(messageJobDto: MessageJobDto): Promise<void> {
    try {
      const messageText = await this.getMessageText(messageJobDto);
      const processtype = messageJobDto.messageProcessType;
      switch (processtype) {
        case MessageProcessType.sms:
          await this.smsService.sendSms(
            messageText,
            messageJobDto.userId,
            messageJobDto.phoneNumber,
            messageJobDto.registrationId,
            messageJobDto.messageContentType,
            messageJobDto.messageProcessType,
          );
          break;
        case MessageProcessType.tryWhatsapp:
          if (!messageJobDto.phoneNumber) {
            throw new Error(`No phoneNumber provided for ${processtype}`);
          }
          await this.storePendingMessageAndSendWhatsappTemplate({
            message: messageText,
            recipientPhoneNr: messageJobDto.phoneNumber,
            registrationId: messageJobDto.registrationId,
            messageContentType: messageJobDto.messageContentType,
            tryWhatsapp: true,
            userId: messageJobDto.userId,
          });
          break;
        case MessageProcessType.whatsappTemplateGeneric:
          if (!messageJobDto.whatsappPhoneNumber) {
            throw new Error(
              `No whatsappPhoneNumber provided for ${processtype}`,
            );
          }
          await this.storePendingMessageAndSendWhatsappTemplate({
            message: messageText,
            recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
            registrationId: messageJobDto.registrationId,
            messageContentType: messageJobDto.messageContentType,
            tryWhatsapp: false,
            userId: messageJobDto.userId,
          });
          break;
        case MessageProcessType.whatsappPendingMessage:
          await this.processWhatsappPendingMessage(messageJobDto);
          break;
        case MessageProcessType.whatsappTemplateVoucher:
          await this.processWhatsappTemplateVoucher(messageJobDto);
          break;
        case MessageProcessType.whatsappPendingVoucher:
          await this.processWhatsappPendingVoucher(messageJobDto);
          break;
        case MessageProcessType.whatsappTemplateVoucherReminder:
        case MessageProcessType.whatsappVoucherInstructions:
        case MessageProcessType.whatsappDefaultReply:
          await this.whatsappService.sendWhatsapp({
            message: messageText,
            contentSid: messageJobDto.contentSid,
            recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
            mediaUrl: messageJobDto.mediaUrl,
            registrationId: messageJobDto.registrationId,
            messageContentType: messageJobDto.messageContentType,
            messageProcessType: messageJobDto.messageProcessType,
            existingSidToUpdate: messageJobDto.customData?.existingMessageSid,
            userId: messageJobDto.userId,
          });
          break;
        default:
          throw new Error(`Invalid message process type: ${processtype}`);
      }
    } catch (error) {
      this.azureLogService.logError(error, false);
      console.log('error: ', error);
      throw error;
    }
  }

  private async getRawMessageText(
    messageJobDto: MessageJobDto,
  ): Promise<string> {
    if (messageJobDto.message) {
      return messageJobDto.message;
    }
    if (messageJobDto.messageTemplateKey) {
      return await this.getTemplateMessageTextOrFallback({
        programId: messageJobDto.programId,
        messageTemplateKey: messageJobDto.messageTemplateKey,
        preferredLanguage: messageJobDto.preferredLanguage,
      });
    }
    return '';
  }

  private async getMessageText(messageJobDto: MessageJobDto): Promise<string> {
    const rawMessageText = await this.getRawMessageText(messageJobDto);
    if (messageJobDto.customData?.placeholderData) {
      return await this.processPlaceholders(
        rawMessageText,
        messageJobDto.customData.placeholderData,
        messageJobDto.preferredLanguage,
      );
    }
    return rawMessageText;
  }

  private async processWhatsappPendingMessage(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    await this.whatsappService
      .sendWhatsapp({
        message: messageJobDto.message,
        recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
        mediaUrl: messageJobDto.mediaUrl,
        registrationId: messageJobDto.registrationId,
        messageContentType: messageJobDto.messageContentType,
        messageProcessType: messageJobDto.messageProcessType,
        existingSidToUpdate: messageJobDto.customData?.existingMessageSid,
        userId: messageJobDto.userId,
      })
      .then(async () => {
        if (!messageJobDto.customData?.pendingMessageId) {
          return;
        }
        return await this.whatsappPendingMessageRepo.delete(
          messageJobDto.customData?.pendingMessageId,
        );
      });
  }

  private async processWhatsappTemplateVoucher(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    let messageSid: string | undefined;
    let errorMessage: string | undefined;
    await this.whatsappService
      .sendWhatsapp({
        contentSid: messageJobDto.contentSid,
        recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
        mediaUrl: messageJobDto.mediaUrl,
        registrationId: messageJobDto.registrationId,
        messageContentType: messageJobDto.messageContentType,
        messageProcessType: messageJobDto.messageProcessType,
        userId: messageJobDto.userId,
      })
      .then(
        (response) => {
          messageSid = response;
          return;
        },
        (error) => {
          errorMessage = error;
        },
      );
    const newTransactionStatus = messageSid
      ? TransactionStatusEnum.waiting
      : TransactionStatusEnum.error;

    if (messageJobDto.customData?.transactionId) {
      await this.intersolveVoucherService.updateTransactionProgressBasedOnInitialMessage(
        {
          transactionId: messageJobDto.customData.transactionId,
          newTransactionStatus,
          userId: messageJobDto.userId,
          messageSid:
            newTransactionStatus === TransactionStatusEnum.error
              ? undefined
              : messageSid, // else = 'waiting'
          errorMessage:
            newTransactionStatus === TransactionStatusEnum.error
              ? errorMessage
              : undefined, // else = 'waiting'
        },
      );
    }
  }

  private async processWhatsappPendingVoucher(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    let messageSid: string | undefined;
    let errorMessage: string | null = null;
    await this.whatsappService
      .sendWhatsapp({
        message: messageJobDto.message,
        recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
        mediaUrl: messageJobDto.mediaUrl,
        registrationId: messageJobDto.registrationId,
        messageContentType: messageJobDto.messageContentType,
        messageProcessType: messageJobDto.messageProcessType,
        existingSidToUpdate: messageJobDto.customData?.existingMessageSid,
        userId: messageJobDto.userId,
      })
      .then(
        (response) => {
          messageSid = response;
          return;
        },
        (error) => {
          // Twilio errors have a 'code' property if it's not a twilio error we do not want to store the stacktrace as
          // it can contains credentials and it means nothing to our users
          errorMessage = 'code' in error ? error : `Unknown error occurred`;
        },
      );

    const newTransactionStatus = messageSid
      ? TransactionStatusEnum.success
      : TransactionStatusEnum.error;
    if (messageJobDto.customData?.transactionId) {
      await this.intersolveVoucherService.updateTransactionProgressBasedOnVoucherMessage(
        {
          transactionId: messageJobDto.customData.transactionId,
          newTransactionStatus,
          errorMessage,
          messageSid,
          intersolveVoucherId: messageJobDto.customData.intersolveVoucherId!,
          userId: messageJobDto.userId,
        },
      );
    }
  }

  private async storePendingMessageAndSendWhatsappTemplate({
    message,
    recipientPhoneNr,
    registrationId,
    messageContentType,
    tryWhatsapp = false,
    userId,
  }: {
    message: string;
    recipientPhoneNr: string;
    registrationId: number;
    messageContentType?: MessageContentType;
    tryWhatsapp?: boolean;
    userId: number;
  }): Promise<void> {
    const pendingMesssage = new WhatsappPendingMessageEntity();
    pendingMesssage.body = message;
    pendingMesssage.to = recipientPhoneNr;
    pendingMesssage.mediaUrl = null;
    pendingMesssage.messageType = null;
    pendingMesssage.registrationId = registrationId;
    pendingMesssage.contentType =
      messageContentType ?? MessageContentType.custom;
    pendingMesssage.userId = userId;
    await this.whatsappPendingMessageRepo.save(pendingMesssage);

    const registration = await this.registrationRepository.findOneOrFail({
      where: { id: Equal(registrationId) },
      relations: ['program'],
    });
    const language = registration.preferredLanguage || this.fallbackLanguage;
    const contentSid = await this.getTemplateContentSidOrFallback({
      programId: registration.program.id,
      messageTemplateKey: ProgramNotificationEnum.whatsappGenericMessage,
      preferredLanguage: language,
    });
    const sid = await this.whatsappService.sendWhatsapp({
      contentSid: contentSid ?? undefined,
      recipientPhoneNr,
      registrationId,
      messageContentType: MessageContentType.genericTemplated,
      messageProcessType: MessageProcessType.whatsappTemplateGeneric,
      userId,
    });
    if (tryWhatsapp) {
      const tryWhatsapp = {
        sid,
        registrationId,
      };
      await this.tryWhatsappRepository.save(tryWhatsapp);
    }
  }

  private async getTemplateMessageTextOrFallback({
    programId,
    messageTemplateKey,
    preferredLanguage,
  }: {
    programId: number;
    messageTemplateKey: string;
    preferredLanguage: string;
  }): Promise<string> {
    return (
      (
        await this.getMessageTemplateForLanguageOrFallback(
          programId,
          messageTemplateKey,
          preferredLanguage,
        )
      ).message ?? ''
    );
  }

  private async getTemplateContentSidOrFallback({
    programId,
    messageTemplateKey,
    preferredLanguage,
  }: {
    programId: number;
    messageTemplateKey: string;
    preferredLanguage: string;
  }): Promise<string> {
    const messageTemplate = await this.getMessageTemplateForLanguageOrFallback(
      programId,
      messageTemplateKey,
      preferredLanguage,
    );
    if (!messageTemplate.contentSid) {
      throw new Error(
        `No contentSid found for message template key: ${messageTemplateKey}, programId: ${programId}, language: ${preferredLanguage}`,
      );
    }
    return messageTemplate.contentSid;
  }

  private async getMessageTemplateForLanguageOrFallback(
    programId: number,
    messageTemplateKey: string,
    preferredLanguage: string,
  ): Promise<{ message: string | null; contentSid: string | null }> {
    const messageTemplates = await this.messageTemplateRepo.findBy({
      program: { id: programId },
      type: messageTemplateKey,
    });

    // Try to find template in preferred language
    const notification = messageTemplates.find(
      (template) => template.language === preferredLanguage,
    );
    if (notification) {
      return {
        message: notification.message,
        contentSid: notification.contentSid,
      };
    }

    // Fallback to default language
    const fallbackNotification = messageTemplates.find(
      (template) => template.language === this.fallbackLanguage,
    );
    if (fallbackNotification) {
      return {
        message: fallbackNotification.message,
        contentSid: fallbackNotification.contentSid,
      };
    }

    // No template found
    // This can happen on projects that have Whatsapp and templates configured incorrectly.
    // TODO: Add feature to pro-actively inform admins of this.
    // It's (currently) better to return *this* than throw an error here; if we
    // send this to Twilio the Twilio error message will show up in the user
    // interface. If we throw an error a user will (probably) not get any
    // feedback.
    return {
      message: '',
      contentSid: null,
    };
  }

  private async processPlaceholders(
    messageTextWithPlaceholders: string,
    placeholderData: Exclude<
      MessageJobCustomDataDto['placeholderData'],
      undefined | null
    >,
    preferredLanguage: LanguageEnum,
  ): Promise<string> {
    let messageText = messageTextWithPlaceholders;
    const language = preferredLanguage || this.fallbackLanguage;
    for (const placeholder of Object.keys(placeholderData)) {
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      if (messageText.match(regex)) {
        const placeHolderValue = placeholderData[placeholder];
        messageText = messageText.replace(
          regex,
          placeHolderValue === null || placeHolderValue === undefined
            ? ''
            : typeof placeHolderValue === 'object'
              ? (placeHolderValue[language] ?? '')
              : placeHolderValue,
        );
      }
    }
    return messageText;
  }
}
