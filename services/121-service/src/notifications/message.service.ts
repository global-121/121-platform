import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { MessageContentType } from './enum/message-type.enum';
import { SmsService } from './sms/sms.service';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { MessageJobDto, MessageProcessType } from './message-job.dto';
import { RegistrationEntity } from '../registration/registration.entity';
import { IntersolveVoucherPayoutStatus } from '../payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { WhatsappPendingMessageEntity } from './whatsapp/whatsapp-pending-message.entity';
import { ProgramNotificationEnum } from './enum/program-notification.enum';
import { IntersolveVoucherService } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { StatusEnum } from '../shared/enum/status.enum';

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
      const processtype = messageJobDto.messageProcessType;

      if (processtype === MessageProcessType.sms) {
        await this.smsService.sendSms(
          messageText,
          messageJobDto.phoneNumber,
          messageJobDto.registrationId,
          messageJobDto.messageContentType,
          messageJobDto.messageProcessType,
        );
      } else if (processtype === MessageProcessType.tryWhatsapp) {
        await this.storePendingMessageAndSendWhatsappTemplate(
          messageText,
          messageJobDto.phoneNumber, // use phoneNumber as whatsappPhoneNumber
          null,
          null,
          messageJobDto.registrationId,
          messageJobDto.messageContentType,
          true, // tryWhatsapp = true
        );
      } else if (processtype === MessageProcessType.whatsappTemplateGeneric) {
        await this.storePendingMessageAndSendWhatsappTemplate(
          messageText,
          messageJobDto.whatsappPhoneNumber,
          null,
          null,
          messageJobDto.registrationId,
          messageJobDto.messageContentType,
          false,
        );
      } else if (processtype === MessageProcessType.whatsappPendingMessage) {
        await this.processWhatsappPendingMessage(messageJobDto);
      } else if (processtype === MessageProcessType.whatsappTemplateVoucher) {
        await this.processWhatsappTemplateVoucher(messageJobDto);
      } else if (processtype === MessageProcessType.whatsappPendingVoucher) {
        await this.processWhatsappPendingVoucher(messageJobDto);
      } else if (
        processtype === MessageProcessType.whatsappTemplateVoucherReminder ||
        processtype === MessageProcessType.whatsappVoucherInstructions ||
        processtype === MessageProcessType.whatsappDefaultReply
      ) {
        await this.whatsappService.sendWhatsapp(
          messageJobDto.message,
          messageJobDto.whatsappPhoneNumber,
          messageJobDto.mediaUrl,
          messageJobDto.registrationId,
          messageJobDto.messageContentType,
          messageJobDto.messageProcessType,
          messageJobDto.customData?.existingMessageSid,
        );
      }
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  private async processWhatsappPendingMessage(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    await this.whatsappService
      .sendWhatsapp(
        messageJobDto.message,
        messageJobDto.whatsappPhoneNumber,
        messageJobDto.mediaUrl,
        messageJobDto.registrationId,
        messageJobDto.messageContentType,
        messageJobDto.messageProcessType,
        messageJobDto.customData?.existingMessageSid,
      )
      .then(async () => {
        return await this.whatsappPendingMessageRepo.delete(
          messageJobDto.customData.pendingMessageId,
        );
      });
  }

  private async processWhatsappTemplateVoucher(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    let messageSid: string;
    let errorMessage: any;
    await this.whatsappService
      .sendWhatsapp(
        messageJobDto.message,
        messageJobDto.whatsappPhoneNumber,
        messageJobDto.mediaUrl,
        messageJobDto.registrationId,
        messageJobDto.messageContentType,
        messageJobDto.messageProcessType,
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
      messageJobDto.registrationId,
      transactionStep,
      status,
      errorMessage,
      messageJobDto.programId,
      messageSid,
      messageJobDto.customData.intersolveVoucherId,
    );
  }

  private async processWhatsappPendingVoucher(
    messageJobDto: MessageJobDto,
  ): Promise<void> {
    let messageSid: string;
    let errorMessage: any;
    await this.whatsappService
      .sendWhatsapp(
        messageJobDto.message,
        messageJobDto.whatsappPhoneNumber,
        messageJobDto.mediaUrl,
        messageJobDto.registrationId,
        messageJobDto.messageContentType,
        messageJobDto.messageProcessType,
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
      messageJobDto.registrationId,
      transactionStep,
      status,
      errorMessage,
      messageJobDto.programId,
      messageSid,
      messageJobDto.customData.intersolveVoucherId,
    );
  }

  private async storePendingMessageAndSendWhatsappTemplate(
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
    const sid = await this.whatsappService.sendWhatsapp(
      whatsappGenericMessage,
      recipientPhoneNr,
      null,
      registrationId,
      MessageContentType.genericTemplated,
      MessageProcessType.whatsappTemplateGeneric,
    );
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
}
