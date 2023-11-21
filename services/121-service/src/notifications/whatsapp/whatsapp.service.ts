import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { EXTERNAL_API, TWILIO_SANDBOX_WHATSAPP_NUMBER } from '../../config';
import { ProgramEntity } from '../../programs/program.entity';
import { MessageContentType } from '../enum/message-type.enum';
import { ProgramNotificationEnum } from '../enum/program-notification.enum';
import { LastMessageStatusService } from '../last-message-status.service';
import { twilioClient } from '../twilio.client';
import { TwilioStatusCallbackDto } from '../twilio.dto';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';
import { WhatsappTemplateTestEntity } from './whatsapp-template-test.entity';
import { MessageProcessType } from '../message-job.dto';

@Injectable()
export class WhatsappService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  @InjectRepository(ProgramEntity)
  private programRepository: Repository<ProgramEntity>;
  @InjectRepository(WhatsappTemplateTestEntity)
  private readonly whatsappTemplateTestRepository: Repository<WhatsappTemplateTestEntity>;

  private readonly whatsappTemplatedMessageKeys = [
    String(ProgramNotificationEnum.whatsappPayment),
    String(ProgramNotificationEnum.whatsappGenericMessage),
  ];

  constructor(private readonly lastMessageService: LastMessageStatusService) {}

  public async sendWhatsapp(
    message: string,
    recipientPhoneNr: string,
    mediaUrl: null | string,
    registrationId?: number,
    messageContentType?: MessageContentType,
    messageProcessType?: MessageProcessType,
    existingSidToUpdate?: string,
  ): Promise<string> {
    const hasPlus = recipientPhoneNr.startsWith('+');

    const payload = {
      body: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      statusCallback: !!process.env.MOCK_TWILIO // This is needed to send reply messages when using MOCK_TWILIO
        ? `${EXTERNAL_API.whatsAppStatus}?messageContentType=${messageContentType}`
        : EXTERNAL_API.whatsAppStatus,
      to: `whatsapp:${hasPlus ? '' : '+'}${recipientPhoneNr}`,
    };
    if (mediaUrl) {
      payload['mediaUrl'] = mediaUrl;
    }
    if (!!process.env.MOCK_TWILIO) {
      payload['messageContentType'] = messageContentType;
    }
    let errorOccurred = false;
    let messageToStore;
    try {
      messageToStore = await twilioClient.messages.create(payload);
      return messageToStore.sid;
    } catch (error) {
      errorOccurred = true;
      messageToStore = {
        accountSid: process.env.TWILIO_SID,
        body: payload.body,
        mediaUrl: mediaUrl,
        to: payload.to,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
        dateCreated: new Date().toISOString(),
        sid: `failed-${uuid()}`,
        status: 'failed',
        errorCode: error.code,
      };
      throw error;
    } finally {
      await this.storeSendWhatsapp(
        messageToStore,
        registrationId,
        mediaUrl,
        messageContentType,
        messageProcessType,
        errorOccurred ? null : existingSidToUpdate,
      );
    }
  }

  public async storeSendWhatsapp(
    message,
    registrationId: number,
    mediaUrl: string,
    messageContentType?: MessageContentType,
    messageProcessType?: MessageProcessType,
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
      twilioMessage.processType = messageProcessType;
      if (message.errorCode) {
        twilioMessage.errorCode = message.errorCode;
      }
      if (message.errorMessage) {
        twilioMessage.errorMessage = message.errorMessage;
      }
      const twilioMessageSave =
        await this.twilioMessageRepository.save(twilioMessage);
      await this.lastMessageService.updateLatestMessage(twilioMessageSave);
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
        await twilioClient.messages.create(payload).then(async (message) => {
          await this.whatsappTemplateTestRepository.save({
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
