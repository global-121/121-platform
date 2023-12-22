import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { formatPhoneNumber } from '../../utils/phone-number.helpers';
import { MessageContentType } from '../enum/message-type.enum';
import { LastMessageStatusService } from '../last-message-status.service';
import { MessageProcessType } from '../message-job.dto';
import { twilioClient } from '../twilio.client';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';
import { EXTERNAL_API } from './../../config';

@Injectable()
export class SmsService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;

  constructor(private readonly lastMessageService: LastMessageStatusService) {}

  public async sendSms(
    message: string,
    recipientPhoneNr: string,
    registrationId: number,
    messageContentType?: MessageContentType,
    messageProcessType?: MessageProcessType,
  ): Promise<void> {
    const to = formatPhoneNumber(recipientPhoneNr);

    let messageToStore;
    try {
      messageToStore = await twilioClient.messages.create({
        body: message,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
        statusCallback: EXTERNAL_API.smsStatus,
        to: to,
      });
    } catch (error) {
      console.log('Error from Twilio:', error);
      messageToStore = {
        accountSid: process.env.TWILIO_SID,
        body: message,
        to: to,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
        dateCreated: new Date().toISOString(),
        sid: `failed-${uuid()}`,
        status: 'failed',
        errorCode: error.code,
      };
      throw error;
    } finally {
      await this.storeSendSms(
        messageToStore,
        registrationId,
        messageContentType,
        messageProcessType,
      );
    }
  }

  public async storeSendSms(
    message,
    registrationId: number,
    messageContentType?: MessageContentType,
    messageProcessType?: MessageProcessType,
  ): Promise<void> {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = message.accountSid;
    twilioMessage.body = message.body;
    twilioMessage.to = message.to;
    twilioMessage.from = message.messagingServiceSid;
    twilioMessage.sid = message.sid;
    twilioMessage.status = message.status;
    twilioMessage.type = NotificationType.Sms;
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

  public async findOne(sid: string): Promise<TwilioMessageEntity> {
    const findOneOptions = {
      sid: sid,
    };
    return await this.twilioMessageRepository.findOneBy(findOneOptions);
  }
}
