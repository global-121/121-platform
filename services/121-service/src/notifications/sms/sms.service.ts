import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { EXTERNAL_API } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TwilioErrorCodes } from '@121-service/src/notifications/enum/twilio-error-codes.enum';
import { MessageProcessType } from '@121-service/src/notifications/message-job.dto';
import { LastMessageStatusService } from '@121-service/src/notifications/services/last-message-status.service';
import { twilioClient } from '@121-service/src/notifications/twilio.client';
import {
  NotificationType,
  TwilioMessageEntity,
} from '@121-service/src/notifications/twilio.entity';
import { formatPhoneNumber } from '@121-service/src/utils/phone-number.helpers';

@Injectable()
export class SmsService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;

  constructor(private readonly lastMessageService: LastMessageStatusService) {}

  public async sendSms(
    message: string,
    userId: number,
    recipientPhoneNr?: string,
    registrationId?: number,
    messageContentType?: MessageContentType,
    messageProcessType?: MessageProcessType,
  ): Promise<void> {
    const to = recipientPhoneNr
      ? formatPhoneNumber(recipientPhoneNr)
      : 'not available'; // When allowEmptyPhoneNumber is true in a project, the to number can be empty and an error will be stored

    try {
      const messageToStore = await twilioClient.messages.create({
        body: message,
        messagingServiceSid: env.TWILIO_MESSAGING_SID,
        statusCallback: EXTERNAL_API.smsStatus,
        to,
      });

      await this.storeSendSms({
        message: messageToStore,
        userId,
        registrationId,
        messageContentType,
        messageProcessType,
      });
    } catch (error) {
      console.log('Error from Twilio:', error);
      await this.storeSendSms({
        message: {
          accountSid: env.TWILIO_SID,
          body: message,
          to,
          messagingServiceSid: env.TWILIO_MESSAGING_SID,
          dateCreated: new Date(),
          sid: `failed-${uuid()}`,
          status: 'failed',
          errorCode: error.code,
          errorMessage: error.message,
        },
        userId,
        registrationId,
        messageContentType,
        messageProcessType,
      });
      if (error.code !== TwilioErrorCodes.toNumberDoesNotExist) {
        throw error;
      } else {
        console.log(
          `SMS not sent to ${to}. Error: ${error.message}. Error code: ${error.code}`,
        );
      }
    }
  }

  private async storeSendSms({
    message,
    userId,
    registrationId,
    messageContentType,
    messageProcessType,
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
    messageContentType?: MessageContentType;
    messageProcessType?: MessageProcessType;
  }): Promise<void> {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = message.accountSid;
    twilioMessage.body = message.body;
    twilioMessage.to = message.to;
    twilioMessage.from = message.messagingServiceSid;
    twilioMessage.sid = message.sid;
    twilioMessage.status = message.status;
    twilioMessage.type = NotificationType.Sms;
    twilioMessage.dateCreated = message.dateCreated;
    twilioMessage.registrationId = registrationId ?? null;
    twilioMessage.contentType = messageContentType ?? MessageContentType.custom;
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

  public async findOne(sid: string): Promise<TwilioMessageEntity | null> {
    const findOneOptions = {
      sid,
    };
    return await this.twilioMessageRepository.findOneBy(findOneOptions);
  }
}
