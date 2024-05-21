import {
  EXTERNAL_API,
  TWILIO_SANDBOX_WHATSAPP_NUMBER,
} from '@121-service/src/config';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { LastMessageStatusService } from '@121-service/src/notifications/last-message-status.service';
import { MessageProcessType } from '@121-service/src/notifications/message-job.dto';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { twilioClient } from '@121-service/src/notifications/twilio.client';
import { TwilioStatusCallbackDto } from '@121-service/src/notifications/twilio.dto';
import {
  NotificationType,
  TwilioMessageEntity,
} from '@121-service/src/notifications/twilio.entity';
import { WhatsappTemplateTestEntity } from '@121-service/src/notifications/whatsapp/whatsapp-template-test.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { formatWhatsAppNumber } from '@121-service/src/utils/phone-number.helpers';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

@Injectable()
export class WhatsappService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(WhatsappTemplateTestEntity)
  private readonly whatsappTemplateTestRepository: Repository<WhatsappTemplateTestEntity>;

  constructor(
    private readonly lastMessageService: LastMessageStatusService,
    private readonly messageTemplateServices: MessageTemplateService,
  ) {}

  public async sendWhatsapp(
    message: string,
    recipientPhoneNr: string,
    mediaUrl: null | string,
    registrationId?: number,
    messageContentType?: MessageContentType,
    messageProcessType?: MessageProcessType,
    existingSidToUpdate?: string,
  ): Promise<string> {
    const payload = {
      body: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
      from: formatWhatsAppNumber(process.env.TWILIO_WHATSAPP_NUMBER),
      statusCallback: !!process.env.MOCK_TWILIO // This is needed to send reply messages when using MOCK_TWILIO
        ? `${EXTERNAL_API.whatsAppStatus}?messageContentType=${messageContentType}`
        : EXTERNAL_API.whatsAppStatus,
      to: formatWhatsAppNumber(recipientPhoneNr),
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
        from: formatWhatsAppNumber(process.env.TWILIO_WHATSAPP_NUMBER),
        statusCallback: EXTERNAL_API.whatsAppStatusTemplateTest,
        to: formatWhatsAppNumber(TWILIO_SANDBOX_WHATSAPP_NUMBER),
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
