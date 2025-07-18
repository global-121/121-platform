import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { Equal, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import {
  EXTERNAL_API,
  TWILIO_SANDBOX_WHATSAPP_NUMBER,
} from '@121-service/src/config';
import { env } from '@121-service/src/env';
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

  public async sendWhatsapp({
    message,
    contentSid,
    recipientPhoneNr,
    mediaUrl,
    registrationId,
    messageContentType,
    messageProcessType,
    existingSidToUpdate,
    userId,
    firstAttempt = true,
  }: {
    message?: string;
    contentSid?: string;
    recipientPhoneNr?: string;
    mediaUrl?: null | string;
    registrationId?: number;
    messageContentType?: MessageContentType;
    messageProcessType?: MessageProcessType;
    existingSidToUpdate?: string;
    userId: number;
    firstAttempt?: boolean; // Controls retry logic for Twilio media errors (63021)
  }): Promise<string> {
    const payload = {
      body: contentSid ? undefined : message,
      contentSid,
      messagingServiceSid: env.TWILIO_MESSAGING_SID,
      from: formatWhatsAppNumber(env.TWILIO_WHATSAPP_NUMBER),
      statusCallback:
        EXTERNAL_API.whatsAppStatus +
        (env.MOCK_TWILIO ? `?messageContentType=${messageContentType}` : ''),
      to: formatWhatsAppNumber(recipientPhoneNr),
    };
    if (mediaUrl) {
      payload['mediaUrl'] = mediaUrl;
    }
    if (env.MOCK_TWILIO) {
      payload['messageContentType'] = messageContentType;
    }

    try {
      const messageToStore = await twilioClient.messages.create(payload);
      // If the message is a template, we need to fetch the body from Twilio due to what we think is a bug in Twilio Node library
      // I opened an issue for it here: https://github.com/twilio/twilio-node/issues/1081
      if (contentSid && !messageToStore.body) {
        const fetchedTemplate = await twilioClient.content.v1
          .contents(contentSid)
          .fetch();
        messageToStore.body =
          fetchedTemplate.types['twilio/quick-reply']?.body ?? '';
      }
      await this.storeSendWhatsapp({
        message: messageToStore,
        userId,
        registrationId,
        mediaUrl,
        messageContentType,
        messageProcessType,
      });
      return messageToStore.sid;
    } catch (error) {
      if (error.code == 63021 && mediaUrl && firstAttempt) {
        firstAttempt = false;
        // Retry once due to Twilio bug (error 63021) that randomly occurs when sending messages with mediaUrl
        // Reference: backlog item 34346
        return this.sendWhatsapp({
          message,
          contentSid,
          recipientPhoneNr,
          mediaUrl,
          registrationId,
          messageContentType,
          messageProcessType,
          existingSidToUpdate,
          userId,
          firstAttempt,
        });
      }

      await this.storeSendWhatsapp({
        message: {
          accountSid: env.TWILIO_SID,
          body: payload.body ?? '',
          to: payload.to,
          messagingServiceSid: env.TWILIO_MESSAGING_SID,
          dateCreated: new Date(),
          sid: `failed-${uuid()}`,
          status: 'failed',
          errorCode: error.code,
          errorMessage: error.message,
        },
        userId,
        registrationId,
        mediaUrl,
        messageContentType,
        messageProcessType,
        existingSidToUpdateDueToFailure: existingSidToUpdate,
      });
      throw error;
    }
  }

  public async storeSendWhatsapp({
    message,
    userId,
    registrationId,
    mediaUrl,
    messageContentType,
    messageProcessType,
    existingSidToUpdateDueToFailure,
  }: {
    message: Pick<
      MessageInstance,
      | 'accountSid'
      | 'body'
      | 'to'
      | 'messagingServiceSid'
      | 'sid'
      | 'status'
      | 'errorCode'
      | 'errorMessage'
      | 'dateCreated'
    >;
    userId: number;
    registrationId?: number;
    mediaUrl?: string | null;
    messageContentType?: MessageContentType;
    messageProcessType?: MessageProcessType;
    existingSidToUpdateDueToFailure?: string;
  }): Promise<void> {
    // If the message failed due to a faulty template error
    // we have to update the existing entry to keep sid the same
    if (existingSidToUpdateDueToFailure) {
      await this.twilioMessageRepository.update(
        { sid: existingSidToUpdateDueToFailure },
        {
          status: message.status,
          sid: message.sid,
          body: message.body,
          mediaUrl,
        },
      );
    } else {
      const twilioMessage = new TwilioMessageEntity();
      twilioMessage.accountSid = message.accountSid;
      twilioMessage.body = message.body;
      twilioMessage.mediaUrl = mediaUrl ?? null;
      twilioMessage.to = message.to;
      twilioMessage.from = message.messagingServiceSid;
      twilioMessage.sid = message.sid;
      twilioMessage.status = message.status;
      twilioMessage.type = NotificationType.Whatsapp;
      twilioMessage.dateCreated = message.dateCreated;
      twilioMessage.registrationId = registrationId ?? null;
      twilioMessage.contentType =
        messageContentType ?? MessageContentType.custom;
      twilioMessage.processType = messageProcessType ?? null;
      twilioMessage.userId = userId;
      if (message.errorCode) {
        twilioMessage.errorCode = message.errorCode.toString();
      }
      if (message.errorMessage) {
        twilioMessage.errorMessage = message.errorMessage;
      }
      const twilioMessageSave =
        await this.twilioMessageRepository.save(twilioMessage);
      await this.lastMessageService.updateLatestMessage(twilioMessageSave);
    }
  }

  public async testTemplates(): Promise<object> {
    const sessionId = uuid();
    const programs = await this.programRepository.find();
    for (const program of programs) {
      await this.testProgramTemplate(program, sessionId);
    }
    return {
      sessionId,
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
    ).filter((template) => template.contentSid);

    await this.testLanguageTemplates(messageTemplates, sessionId);
  }

  private async testLanguageTemplates(
    messageTemplates: MessageTemplateEntity[],
    sessionId: string,
  ): Promise<void> {
    for (const messageTemplate of messageTemplates) {
      const payload = {
        body: messageTemplate.message ?? undefined,
        messagingServiceSid: env.TWILIO_MESSAGING_SID,
        from: formatWhatsAppNumber(env.TWILIO_WHATSAPP_NUMBER),
        statusCallback: EXTERNAL_API.whatsAppStatusTemplateTest,
        to: formatWhatsAppNumber(TWILIO_SANDBOX_WHATSAPP_NUMBER),
      };
      const message = await twilioClient.messages.create(payload);
      await this.whatsappTemplateTestRepository.save({
        sid: message.sid,
        language: messageTemplate.language,
        programId: messageTemplate.programId,
        messageKey: messageTemplate.type,
        sessionId,
      });
      // Wait 2 seconds to prevent Twilio from exceeded Rate limit for Channel
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  public async storeTemplateTestResult(
    callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    if (!callbackData.SmsSid) {
      throw new HttpException('SmsSid not provided', HttpStatus.BAD_REQUEST);
    }
    const tryWhatsappTemplateEntity =
      await this.whatsappTemplateTestRepository.findOne({
        where: { sid: Equal(callbackData.SmsSid) },
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
        where: { sessionId: Equal(sessionId) },
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
    ).filter((template) => template.contentSid);

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
            language: Equal(messageTemplate.language),
            messageKey: Equal(messageTemplate.type),
            programId: Equal(messageTemplate.programId),
            sessionId: Equal(sessionId),
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
          callback: whatsappTemplateTestEntity.callback
            ? JSON.parse(whatsappTemplateTestEntity.callback)
            : undefined,
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
