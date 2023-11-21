import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { EXTERNAL_API, TWILIO_SANDBOX_WHATSAPP_NUMBER } from '../../config';
import { IntersolveVoucherPayoutStatus } from '../../payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { MessageContentType } from '../enum/message-type.enum';
import { ProgramNotificationEnum } from '../enum/program-notification.enum';
import { LastMessageStatusService } from '../last-message-status.service';
import { twilioClient } from '../twilio.client';
import { TwilioStatusCallbackDto } from '../twilio.dto';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';
import { WhatsappPendingMessageEntity } from './whatsapp-pending-message.entity';
import { WhatsappTemplateTestEntity } from './whatsapp-template-test.entity';
import { MessageTemplateService } from '../message-template/message-template.service';
import { MessageTemplateEntity } from '../message-template/message-template.entity';

@Injectable()
export class WhatsappService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(ProgramEntity)
  private programRepository: Repository<ProgramEntity>;
  @InjectRepository(WhatsappTemplateTestEntity)
  private readonly whatsappTemplateTestRepository: Repository<WhatsappTemplateTestEntity>;
  @InjectRepository(WhatsappPendingMessageEntity)
  private readonly whatsappPendingMessageRepo: Repository<WhatsappPendingMessageEntity>;
  private readonly fallbackLanguage = 'en';
  private readonly whatsappTemplatedMessageKeys = [
    String(ProgramNotificationEnum.whatsappPayment),
    String(ProgramNotificationEnum.whatsappGenericMessage),
  ];

  constructor(
    private readonly lastMessageService: LastMessageStatusService,
    private readonly messageTemplateServices: MessageTemplateService,
  ) {}

  public async sendWhatsapp(
    message: string,
    recipientPhoneNr: string,
    messageType: null | IntersolveVoucherPayoutStatus,
    mediaUrl: null | string,
    registrationId?: number,
    messageContentType?: MessageContentType,
    existingSidToUpdate?: string,
  ): Promise<any> {
    const hasPlus = recipientPhoneNr.startsWith('+');

    const payload = {
      body: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      statusCallback: EXTERNAL_API.whatsAppStatus,
      to: `whatsapp:${hasPlus ? '' : '+'}${recipientPhoneNr}`,
    };
    if (mediaUrl) {
      payload['mediaUrl'] = mediaUrl;
    }
    if (!!process.env.MOCK_TWILIO) {
      payload['messageType'] = messageType;
    }
    return twilioClient.messages
      .create(payload)
      .then(async (message) => {
        await this.storeSendWhatsapp(
          message,
          registrationId,
          mediaUrl,
          messageContentType,
          existingSidToUpdate,
        );
        return message.sid;
      })
      .catch(async (err) => {
        console.log('Error from Twilio:', err);
        const failedMessage = {
          accountSid: process.env.TWILIO_SID,
          body: payload.body,
          mediaUrl: mediaUrl,
          to: payload.to,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
          dateCreated: new Date().toISOString(),
          sid: `failed-${uuid()}`,
          status: 'failed',
          errorCode: err.code,
        };
        await this.storeSendWhatsapp(
          failedMessage,
          registrationId,
          mediaUrl,
          messageContentType,
        );
      });
  }

  public async queueMessageSendTemplate(
    message: string,
    recipientPhoneNr: string,
    messageType: null | IntersolveVoucherPayoutStatus,
    mediaUrl: null | string,
    registrationId: number,
    messageContentType: MessageContentType,
  ): Promise<any> {
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
    const whatsappGenericMessage = await this.getGenericNotificationText(
      language,
      registration.program,
    );
    return this.sendWhatsapp(
      whatsappGenericMessage,
      recipientPhoneNr,
      messageType,
      mediaUrl,
      registrationId,
      MessageContentType.genericTemplated,
    );
  }

  public async getGenericNotificationText(
    language: string,
    program: ProgramEntity,
  ): Promise<string> {
    const key = ProgramNotificationEnum.whatsappGenericMessage;
    const messageTemplates =
      await this.messageTemplateServices.getMessageTemplatesByProgramId(
        program.id,
        key,
      );

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

  public async storeSendWhatsapp(
    message,
    registrationId: number,
    mediaUrl: string,
    messageContentType?: MessageContentType,
    existingSidToUpdate?: string,
  ): Promise<void> {
    // If the message failed due to a faulty template error
    // we have to update the existing entry to keep sid the same
    if (existingSidToUpdate) {
      await this.twilioMessageRepository.update(
        { sid: existingSidToUpdate },
        {
          status: message.status,
          sid: message.sid,
          body: message.body,
          mediaUrl: mediaUrl,
        },
      );
    } else {
      const twilioMessage = new TwilioMessageEntity();
      twilioMessage.accountSid = message.accountSid;
      twilioMessage.body = message.body;
      twilioMessage.mediaUrl = mediaUrl;
      twilioMessage.to = message.to;
      twilioMessage.from = message.messagingServiceSid;
      twilioMessage.sid = message.sid;
      twilioMessage.status = message.status;
      twilioMessage.type = NotificationType.Whatsapp;
      twilioMessage.dateCreated = message.dateCreated;
      twilioMessage.registrationId = registrationId;
      twilioMessage.contentType = messageContentType;
      if (message.errorCode) {
        twilioMessage.errorCode = message.errorCode;
      }
      if (message.errorMessage) {
        twilioMessage.errorMessage = message.errorMessage;
      }
      await this.twilioMessageRepository.save(twilioMessage);
    }
    // This is commented out because we think this is causing performance issues
    // await this.lastMessageService.updateLastMessageStatus(message.sid);
  }

  public async findOne(sid: string): Promise<TwilioMessageEntity> {
    const findOneOptions = {
      sid: sid,
    };
    return await this.twilioMessageRepository.findOneBy(findOneOptions);
  }

  public async testTemplates(): Promise<object> {
    const sessionId = uuid();
    const programs = await this.programRepository.find();
    for (const program of programs) {
      await this.testProgramTemplate(program, sessionId);
    }
    return {
      sessionId: sessionId,
    };
  }

  private async testProgramTemplate(
    program: ProgramEntity,
    sessionId: string,
  ): Promise<void> {
    const messageTemplates = (
      await this.messageTemplateServices.getMessageTemplatesByProgramId(
        program.id,
      )
    ).filter((template) => template.isWhatsappTemplate);

    await this.testLanguageTemplates(messageTemplates, sessionId);
  }

  private async testLanguageTemplates(
    messageTemplates: MessageTemplateEntity[],
    sessionId: string,
  ): Promise<void> {
    for (const messageTemplate of messageTemplates) {
      const payload = {
        body: messageTemplate.message,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
        from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
        statusCallback: EXTERNAL_API.whatsAppStatusTemplateTest,
        to: 'whatsapp:' + TWILIO_SANDBOX_WHATSAPP_NUMBER,
      };
      await twilioClient.messages.create(payload).then(async (message) => {
        await this.whatsappTemplateTestRepository.save({
          sid: message.sid,
          language: messageTemplate.language,
          programId: messageTemplate.programId,
          messageKey: messageTemplate.type,
          sessionId: sessionId,
        });
        return 'Succes';
      });
      // Wait 2 seconds to prevent Twilio from exceeded Rate limit for Channel
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  public async storeTemplateTestResult(
    callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    const tryWhatsappTemplateEntity =
      await this.whatsappTemplateTestRepository.findOne({
        where: { sid: callbackData.SmsSid },
      });
    if (tryWhatsappTemplateEntity) {
      if (!tryWhatsappTemplateEntity.succes) {
        tryWhatsappTemplateEntity.callback = JSON.stringify(callbackData);
        tryWhatsappTemplateEntity.succes =
          callbackData.MessageStatus === 'delivered';
        await this.whatsappTemplateTestRepository.save(
          tryWhatsappTemplateEntity,
        );
      }
    } else {
      throw new HttpException('Message sid not found', HttpStatus.NOT_FOUND);
    }
  }

  public async getWhatsappTemplateResult(sessionId: string): Promise<object> {
    const tryWhatsappTemplateEntity =
      await this.whatsappTemplateTestRepository.findOne({
        where: {
          sessionId: sessionId,
        },
      });
    if (!tryWhatsappTemplateEntity) {
      return {
        error: 'sessionId not found',
      };
    }
    const programs = await this.programRepository.find();
    const result = {};
    for (const program of programs) {
      result[`program-${program.id}`] = await this.getProgramTemplateResult(
        program,
        sessionId,
      );
    }
    return result;
  }

  private async getProgramTemplateResult(
    program: ProgramEntity,
    sessionId: string,
  ): Promise<object> {
    const messageTemplates = (
      await this.messageTemplateServices.getMessageTemplatesByProgramId(
        program.id,
      )
    ).filter((template) => template.isWhatsappTemplate);

    return await this.getLanguageTemplateResults(messageTemplates, sessionId);
  }

  private async getLanguageTemplateResults(
    messagesTemplates: MessageTemplateEntity[],
    sessionId: string,
  ): Promise<object> {
    const resultsLanguage = {};

    for (const messageTemplate of messagesTemplates) {
      // Initialize the language property if it doesn't exist
      if (!resultsLanguage[messageTemplate.language]) {
        resultsLanguage[messageTemplate.language] = {};
      }

      const whatsappTemplateTestEntity =
        await this.whatsappTemplateTestRepository.findOne({
          where: {
            language: messageTemplate.language,
            messageKey: messageTemplate.type,
            programId: messageTemplate.programId,
            sessionId: sessionId,
          },
          order: { created: 'ASC' },
        });
      if (whatsappTemplateTestEntity && whatsappTemplateTestEntity.succes) {
        resultsLanguage[messageTemplate.language][messageTemplate.type] = {
          status: 'Succes',
          created: whatsappTemplateTestEntity.created,
        };
      } else if (whatsappTemplateTestEntity) {
        resultsLanguage[messageTemplate.language][messageTemplate.type] = {
          status: 'Failed',
          created: whatsappTemplateTestEntity.created,
          callback: JSON.parse(whatsappTemplateTestEntity.callback),
        };
      } else {
        resultsLanguage[messageTemplate.language][messageTemplate.type] = {
          status: 'No tests found for this notification',
        };
      }
    }

    return resultsLanguage;
  }
}
