import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import {
  MessageContentType,
  ReplacedByGenericTemplateMessageTypes,
} from './enum/message-type.enum';
import { SmsService } from './sms/sms.service';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { MessageJobDto, MessageProccessType } from './message-job.dto';
import { RegistrationEntity } from '../registration/registration.entity';
import { IntersolveVoucherPayoutStatus } from '../payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { WhatsappPendingMessageEntity } from './whatsapp/whatsapp-pending-message.entity';
import { ProgramNotificationEnum } from './enum/program-notification.enum';
import { IntersolveVoucherService } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { StatusEnum } from '../shared/enum/status.enum';
import { QueueMessageService } from './queue-message/queue-message.service';

@Injectable()
export class MessageService {
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(RegistrationEntity)
  public readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(WhatsappPendingMessageEntity)
  private readonly whatsappPendingMessageRepo: Repository<WhatsappPendingMessageEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly whatsappService: WhatsappService,
    private readonly smsService: SmsService,
    private readonly dataSource: DataSource,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly queueMessageService: QueueMessageService,
  ) {}

  public async sendTextMessage(messageJobDto: MessageJobDto): Promise<void> {
    try {
      const messageText = messageJobDto.message
        ? messageJobDto.message
        : await this.getNotificationText(
            messageJobDto.preferredLanguage,
            messageJobDto.key,
            messageJobDto.programId,
          );
      const whatsappPhoneNumber = messageJobDto.customData?.tryWhatsapp // TODO: fix this
        ? messageJobDto.phoneNumber
        : messageJobDto.whatsappPhoneNumber;
      const processtype = messageJobDto.messageProcessType;

      if (processtype === MessageProccessType.sms) {
        await this.smsService.sendSms(
          messageText,
          messageJobDto.phoneNumber,
          messageJobDto.id,
          messageJobDto.messageContentType,
        );
      } else if (processtype === MessageProccessType.whatsappTemplateGeneric) {
        await this.storePendingMessageAndSendTemplate(
          messageText,
          whatsappPhoneNumber,
          null,
          null,
          messageJobDto.id,
          messageJobDto.messageContentType,
          false, // TODO: fix this
        );
      } else if (processtype === MessageProccessType.whatappTemplateVoucher) {
        await this.processWhatappTemplateVoucher(messageJobDto);
      } else if (
        processtype === MessageProccessType.whatsappTemplateVoucherReminder
      ) {
        await this.whatsappService.sendWhatsapp(
          messageJobDto.message,
          whatsappPhoneNumber,
          messageJobDto.mediaUrl,
          messageJobDto.id,
          messageJobDto.messageContentType,
        );
      } else if (
        processtype === MessageProccessType.whatsappPendingInformation
      ) {
        await this.whatsappService.sendWhatsapp(
          messageJobDto.message,
          whatsappPhoneNumber,
          messageJobDto.mediaUrl,
          messageJobDto.id,
          messageJobDto.messageContentType,
          messageJobDto.customData?.existingMessageSid,
        );
      } else if (processtype === MessageProccessType.whatsappPendingVoucher) {
        await this.processWhatappPendingVoucher(messageJobDto);
      } else if (
        processtype === MessageProccessType.whatsappNoPendingMessages
      ) {
        await this.whatsappService.sendWhatsapp(
          messageJobDto.message,
          whatsappPhoneNumber,
          messageJobDto.mediaUrl,
          messageJobDto.id,
          messageJobDto.messageContentType,
          messageJobDto.customData?.existingMessageSid,
        );
      } else if (processtype === MessageProccessType.tryWhatsapp) {
        await this.tryWhatsapp(
          messageJobDto,
          messageText,
          messageJobDto.messageContentType,
        );
      }
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  private async old(messageJobDto: MessageJobDto): Promise<void> {
    try {
      const messageText = messageJobDto.message
        ? messageJobDto.message
        : await this.getNotificationText(
            messageJobDto.preferredLanguage,
            messageJobDto.key,
            messageJobDto.programId,
          );
      const whatsappNumber = messageJobDto.whatsappPhoneNumber;
      if (whatsappNumber) {
        if (
          ReplacedByGenericTemplateMessageTypes.includes(
            messageJobDto.messageContentType,
          ) &&
          !messageJobDto.customData?.replyMessage
        ) {
          await this.storePendingMessageAndSendTemplate(
            messageText,
            whatsappNumber,
            null,
            null,
            messageJobDto.id,
            messageJobDto.messageContentType,
            false,
          );
        } else {
          let messageSid: string;
          let errorMessage: any;
          await this.whatsappService
            .sendWhatsapp(
              messageJobDto.message,
              whatsappNumber,
              messageJobDto.mediaUrl,
              messageJobDto.id,
              messageJobDto.messageContentType,
              messageJobDto.customData?.existingMessageSid,
            )
            .then(
              (response) => {
                messageSid = response;
                return;
              },
              (error) => {
                if (
                  (messageJobDto.messageContentType =
                    MessageContentType.paymentTemplated)
                ) {
                  errorMessage = error;
                } else {
                  throw error;
                }
              },
            );
          if (
            [
              MessageContentType.paymentTemplated,
              MessageContentType.paymentVoucher,
            ].includes(messageJobDto.messageContentType)
          ) {
            // If this is either the initial or the follow-up intersolve-voucher message, then store transaction result
            await this.intersolveVoucherService.storeTransactionResult(
              messageJobDto.customData.payment,
              messageJobDto.customData.amount,
              messageJobDto.id,
              messageJobDto.messageContentType ===
                MessageContentType.paymentTemplated
                ? 1
                : 2,
              messageJobDto.messageContentType === MessageContentType.payment
                ? StatusEnum.success
                : messageSid
                ? StatusEnum.waiting
                : StatusEnum.error,
              errorMessage,
              messageJobDto.programId,
              messageSid,
              messageJobDto.customData.intersolveVoucherId,
            );
          } else if (
            ReplacedByGenericTemplateMessageTypes.includes(
              messageJobDto.messageContentType,
            ) &&
            messageJobDto.customData?.replyMessage
          ) {
            // If this is a reply message on a pending message, delete the pending message
            await this.whatsappPendingMessageRepo.delete({
              id: messageJobDto.customData.pendingMessageId,
            });
          } else if (messageJobDto.customData.tryWhatsapp) {
            // If this is a tryWhatsapp message, save it for later handling the status callback
            const tryWhatsapp = {
              sid: messageSid,
              registrationId: messageJobDto.id,
            };
            await this.tryWhatsappRepository.save(tryWhatsapp);
          }
        }
      } else if (messageJobDto.tryWhatsApp && messageJobDto.phoneNumber) {
        await this.tryWhatsapp(
          messageJobDto,
          messageText,
          messageJobDto.messageContentType,
        );
      } else if (messageJobDto.phoneNumber) {
        await this.smsService.sendSms(
          messageText,
          messageJobDto.phoneNumber,
          messageJobDto.id,
          messageJobDto.messageContentType,
        );
      } else {
        throw new HttpException(
          'A recipientPhoneNr should be supplied.',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  private async processWhatappTemplateVoucher(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    let messageSid: string;
    let errorMessage: any;
    await this.whatsappService
      .sendWhatsapp(
        messageJobDto.message,
        messageJobDto.whatsappPhoneNumber,
        messageJobDto.mediaUrl,
        messageJobDto.id,
        messageJobDto.messageContentType,
        messageJobDto.customData?.existingMessageSid,
      )
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

    await this.intersolveVoucherService.storeTransactionResult(
      messageJobDto.customData.payment,
      messageJobDto.customData.amount,
      messageJobDto.id,
      transactionStep,
      status,
      errorMessage,
      messageJobDto.programId,
      messageSid,
      messageJobDto.customData.intersolveVoucherId,
    );
  }

  private async processWhatappPendingVoucher(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    let messageSid: string;
    let errorMessage: any;
    await this.whatsappService
      .sendWhatsapp(
        messageJobDto.message,
        messageJobDto.whatsappPhoneNumber,
        messageJobDto.mediaUrl,
        messageJobDto.id,
        messageJobDto.messageContentType,
        messageJobDto.customData?.existingMessageSid,
      )
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

    await this.intersolveVoucherService.storeTransactionResult(
      messageJobDto.customData.payment,
      messageJobDto.customData.amount,
      messageJobDto.id,
      transactionStep,
      status,
      errorMessage,
      messageJobDto.programId,
      messageSid,
      messageJobDto.customData.intersolveVoucherId,
    );
  }

  private async storePendingMessageAndSendTemplate(
    message: string,
    recipientPhoneNr: string,
    messageType: null | IntersolveVoucherPayoutStatus,
    mediaUrl: null | string,
    registrationId: number,
    messageContentType: MessageContentType,
    tryWhatsapp: boolean,
  ): Promise<void> {
    const pendingMesssage = new WhatsappPendingMessageEntity();
    pendingMesssage.body = message;
    pendingMesssage.to = recipientPhoneNr;
    pendingMesssage.mediaUrl = mediaUrl;
    pendingMesssage.messageType = messageType;
    pendingMesssage.registrationId = registrationId;
    pendingMesssage.contentType = messageContentType;
    await this.whatsappPendingMessageRepo.save(pendingMesssage);

    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId },
      relations: ['program'],
    });
    const language = registration.preferredLanguage || this.fallbackLanguage;
    const whatsappGenericMessage = await this.getNotificationText(
      language,
      ProgramNotificationEnum.whatsappGenericMessage,
      registration.program.id,
    );
    await this.queueMessageService.addMessageToQueue(
      registration,
      whatsappGenericMessage,
      null,
      false,
      MessageContentType.genericTemplated,
      MessageProccessType.whatsappTemplateGeneric,
      null,
      { tryWhatsapp },
    );
  }

  private async getNotificationText(
    language: string,
    key: string,
    programId: number,
  ): Promise<string> {
    const program = await this.dataSource
      .getRepository(ProgramEntity)
      .findOneBy({
        id: programId,
      });
    const fallbackNotifications = program.notifications[this.fallbackLanguage];
    let notifications = fallbackNotifications;

    if (program.notifications[language]) {
      notifications = program.notifications[language];
    }
    if (notifications[key]) {
      return notifications[key];
    }
    return fallbackNotifications[key] ? fallbackNotifications[key] : '';
  }

  private async tryWhatsapp(
    messageJobDto: MessageJobDto,
    messageText,
    messageContentType?: MessageContentType,
  ): Promise<void> {
    await this.storePendingMessageAndSendTemplate(
      messageText,
      messageJobDto.phoneNumber,
      null,
      null,
      messageJobDto.id,
      messageContentType,
      true,
    );
  }
}
