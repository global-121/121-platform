import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import {
  MessageJobDto,
  MessageProcessType,
} from '@121-service/src/notifications/message-job.dto';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { SmsService } from '@121-service/src/notifications/sms/sms.service';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { WhatsappService } from '@121-service/src/notifications/whatsapp/whatsapp.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

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
            recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
            mediaUrl: messageJobDto.mediaUrl,
            registrationId: messageJobDto.registrationId,
            messageContentType: messageJobDto.messageContentType,
            messageProcessType: messageJobDto.messageProcessType,
            existingSidToUpdate: messageJobDto.customData?.existingMessageSid,
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
      return await this.getNotificationText(
        messageJobDto.preferredLanguage,
        messageJobDto.messageTemplateKey,
        messageJobDto.programId,
      );
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
    let errorMessage: any;
    await this.whatsappService
      .sendWhatsapp({
        message: messageJobDto.message,
        recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
        mediaUrl: messageJobDto.mediaUrl,
        registrationId: messageJobDto.registrationId,
        messageContentType: messageJobDto.messageContentType,
        messageProcessType: messageJobDto.messageProcessType,
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
    const transactionStep = 1;
    const status = messageSid ? StatusEnum.waiting : StatusEnum.error;

    if (messageJobDto.customData?.payment) {
      await this.intersolveVoucherService.updateTransactionBasedTwilioMessageCreate(
        messageJobDto.customData.payment,
        messageJobDto.registrationId,
        status,
        transactionStep,
        status === StatusEnum.error ? undefined : messageSid, // else = 'waiting'
        status === StatusEnum.error ? errorMessage : undefined, // else = 'waiting'
      );
    }
  }

  private async processWhatsappPendingVoucher(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    let messageSid: string | undefined;
    let errorMessage: any;
    await this.whatsappService
      .sendWhatsapp({
        message: messageJobDto.message,
        recipientPhoneNr: messageJobDto.whatsappPhoneNumber,
        mediaUrl: messageJobDto.mediaUrl,
        registrationId: messageJobDto.registrationId,
        messageContentType: messageJobDto.messageContentType,
        messageProcessType: messageJobDto.messageProcessType,
        existingSidToUpdate: messageJobDto.customData?.existingMessageSid,
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
    const transactionStep = 2;
    const status = StatusEnum.success;

    if (
      messageJobDto.customData?.payment &&
      messageJobDto.customData.amount != undefined
    ) {
      await this.intersolveVoucherService.storeTransactionResult(
        messageJobDto.customData.payment,
        messageJobDto.customData.amount,
        messageJobDto.registrationId,
        transactionStep,
        status,
        errorMessage,
        messageJobDto.programId,
        {
          messageSid,
          intersolveVoucherId: messageJobDto.customData.intersolveVoucherId,
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
  }: {
    message: string;
    recipientPhoneNr: string;
    registrationId: number;
    messageContentType?: MessageContentType;
    tryWhatsapp?: boolean;
  }): Promise<void> {
    const pendingMesssage = new WhatsappPendingMessageEntity();
    pendingMesssage.body = message;
    pendingMesssage.to = recipientPhoneNr;
    pendingMesssage.mediaUrl = null;
    pendingMesssage.messageType = null;
    pendingMesssage.registrationId = registrationId;
    pendingMesssage.contentType =
      messageContentType ?? MessageContentType.custom;
    await this.whatsappPendingMessageRepo.save(pendingMesssage);

    const registration = await this.registrationRepository.findOne({
      where: { id: Equal(registrationId) },
      relations: ['program'],
    });
    const language = registration?.preferredLanguage || this.fallbackLanguage;
    const whatsappGenericMessage = await this.getNotificationText(
      language,
      ProgramNotificationEnum.whatsappGenericMessage,
      registration?.program.id,
    );
    const sid = await this.whatsappService.sendWhatsapp({
      message: whatsappGenericMessage,
      recipientPhoneNr,
      registrationId,
      messageContentType: MessageContentType.genericTemplated,
      messageProcessType: MessageProcessType.whatsappTemplateGeneric,
    });
    if (tryWhatsapp) {
      const tryWhatsapp = {
        sid,
        registrationId,
      };
      await this.tryWhatsappRepository.save(tryWhatsapp);
    }
  }

  private async getNotificationText(
    language: string,
    messageTemplateKey: string,
    programId?: number,
  ): Promise<string> {
    const messageTemplates = await this.messageTemplateRepo.findBy({
      program: { id: programId },
      type: messageTemplateKey,
    });

    const notification = messageTemplates.find(
      (template) => template.language === language,
    );
    if (notification) {
      return notification.message;
    }

    const fallbackNotification = messageTemplates.find(
      (template) => template.language === this.fallbackLanguage,
    );
    if (fallbackNotification) {
      return fallbackNotification.message;
    }

    return '';
  }

  private async processPlaceholders(
    messageTextWithPlaceholders: string,
    placeholderData: object,
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
              ? placeHolderValue[language] ?? ''
              : placeHolderValue,
        );
      }
    }
    return messageText;
  }
}
