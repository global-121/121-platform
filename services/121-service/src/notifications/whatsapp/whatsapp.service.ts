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
import { twilioClient } from '../twilio.client';
import { TwilioStatusCallbackDto } from '../twilio.dto';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';
import { WhatsappPendingMessageEntity } from './whatsapp-pending-message.entity';
import { WhatsappTemplateTestEntity } from './whatsapp-template-test.entity';

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
      .then((message) => {
        this.storeSendWhatsapp(
          message,
          registrationId,
          mediaUrl,
          messageContentType,
          existingSidToUpdate,
        );
        return message.sid;
      })
      .catch((err) => {
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
        this.storeSendWhatsapp(
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
    this.whatsappPendingMessageRepo.save(pendingMesssage);

    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId },
      relations: ['program'],
    });
    const language = registration.preferredLanguage || this.fallbackLanguage;
    const whatsappGenericMessage = this.getGenericNotificationText(
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

  public getGenericNotificationText(
    language: string,
    program: ProgramEntity,
  ): string {
    const key = ProgramNotificationEnum.whatsappGenericMessage;
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

  public storeSendWhatsapp(
    message,
    registrationId: number,
    mediaUrl: string,
    messageContentType?: MessageContentType,
    existingSidToUpdate?: string,
  ): void {
    // If the message failed due to a faulty template error
    // we have to update the existing entry to keep sid the same
    if (existingSidToUpdate) {
      this.twilioMessageRepository.update(
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
      this.twilioMessageRepository.save(twilioMessage);
    }
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
    for (const [languageKey, notifications] of Object.entries(
      program.notifications,
    )) {
      await this.testLanguageTemplates(
        notifications,
        languageKey,
        program.id,
        sessionId,
      );
    }
  }

  private async testLanguageTemplates(
    messages: object,
    language: string,
    programId: number,
    sessionId: string,
  ): Promise<void> {
    for (const [messageKey, messageText] of Object.entries(messages)) {
      if (this.whatsappTemplatedMessageKeys.includes(messageKey)) {
        const payload = {
          body: messageText,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
          from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
          statusCallback: EXTERNAL_API.whatsAppStatusTemplateTest,
          to: 'whatsapp:' + TWILIO_SANDBOX_WHATSAPP_NUMBER,
        };
        await twilioClient.messages.create(payload).then((message) => {
          this.whatsappTemplateTestRepository.save({
            sid: message.sid,
            language: language,
            programId: programId,
            messageKey: messageKey,
            sessionId: sessionId,
          });
          return 'Succes';
        });
      }
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
        this.whatsappTemplateTestRepository.save(tryWhatsappTemplateEntity);
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
    const resultOfProgram = {};
    for (const [languageKey, notifications] of Object.entries(
      program.notifications,
    )) {
      resultOfProgram[languageKey] = await this.getLanguageTemplateResults(
        notifications,
        languageKey,
        program.id,
        sessionId,
      );
    }
    return resultOfProgram;
  }

  private async getLanguageTemplateResults(
    messages: object,
    language: string,
    programId: number,
    sessionId: string,
  ): Promise<object> {
    const resultsLanguage = {};
    for (const messageKey in messages) {
      if (this.whatsappTemplatedMessageKeys.includes(messageKey)) {
        const whatsappTemplateTestEntity =
          await this.whatsappTemplateTestRepository.findOne({
            where: {
              language: language,
              messageKey: messageKey,
              programId: programId,
              sessionId: sessionId,
            },
            order: { created: 'ASC' },
          });
        if (whatsappTemplateTestEntity && whatsappTemplateTestEntity.succes) {
          resultsLanguage[messageKey] = {
            status: 'Succes',
            created: whatsappTemplateTestEntity.created,
          };
        } else if (whatsappTemplateTestEntity) {
          resultsLanguage[messageKey] = {
            status: 'Failed',
            created: whatsappTemplateTestEntity.created,
            callback: JSON.parse(whatsappTemplateTestEntity.callback),
          };
        } else {
          resultsLanguage[messageKey] = {
            status: 'No tests found for this notification',
          };
        }
      }
    }
    return resultsLanguage;
  }
}
