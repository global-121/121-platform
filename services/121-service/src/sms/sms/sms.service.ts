import { STAGING_URL } from './../../config';
import { Injectable } from '@nestjs/common';
import { TWILIO } from '../../secrets';
import { DEBUG, PRODUCTION_URL } from '../../config';
import { twilioClient } from './twilio.client';
import { TwilioMessageEntity } from './twilio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

let appUrl: string;
if (process.env.NODE_ENV == 'production') {
  appUrl = PRODUCTION_URL;
} else if (process.env.NODE_ENV == 'staging') {
  appUrl = STAGING_URL;
} else {
  appUrl = TWILIO.ngrok;
}
export const callbackUrl = appUrl + 'api/sms/status';
@Injectable()
export class SmsService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  public constructor() {}

  public sendSms(message : string, recipientPhoneNr: string) {
    console.log('Send sms');

    // Overwrite recipient phone number for testing phase
    console.log('recipientPhoneNr: ', recipientPhoneNr);
    recipientPhoneNr = TWILIO.testToNumber;
    console.log('url', callbackUrl);
    twilioClient.messages
      .create({
        body: message,
        from: TWILIO.testFromNumber, // This parameter could be specifief per program
        statusCallback: callbackUrl,
        to: TWILIO.testToNumber,
      })
      .then(message => this.storeSendSms(message));
  }

  public storeSendSms(message) {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = message.accountSid;
    twilioMessage.body = message.body;
    twilioMessage.to = message.to;
    twilioMessage.from = message.from;
    twilioMessage.sid = message.sid;
    twilioMessage.status = message.status;
    twilioMessage.dateCreated = message.dateCreated;
    this.twilioMessageRepository.save(twilioMessage);
  }

  public async findOne(sid: string): Promise<TwilioMessageEntity> {
    const findOneOptions = {
      sid: sid,
    };
    return await this.twilioMessageRepository.findOne(findOneOptions);
  }

  public async statusCallback(callbackData) {
    await this.twilioMessageRepository.update(
      { sid: callbackData.MessageSid },
      { status: callbackData.SmsStatus },
    );

  }
}
