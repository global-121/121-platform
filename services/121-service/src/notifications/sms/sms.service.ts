import { STAGING_URL } from './../../config';
import { Injectable } from '@nestjs/common';
import { TWILIO } from '../../secrets';
import { DEBUG, PRODUCTION_URL } from '../../config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwilioMessageEntity, NotificationType } from '../twilio.entity';
import { twilioClient, callbackUrlSms } from '../twilio.client';
import { ProgramService } from '../../programs/program/program.service';


@Injectable()
export class SmsService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  public async notifyBySms(
    recipientPhoneNr: string,
    language: string,
    key: string,
    programId: number,
  ): Promise<void> {
    const smsText = await this.getSmsText(language, key, programId);
    this.sendSms(smsText, recipientPhoneNr);
  }

  public async sendSms(message: string, recipientPhoneNr: string) {
    // Overwrite recipient phone number for testing phase
    recipientPhoneNr = TWILIO.testToNumber;

    twilioClient.messages
      .create({
        body: message,
        from: TWILIO.testFromNumber, // This parameter could be specifief per program
        statusCallback: callbackUrlSms,
        to: recipientPhoneNr,
      })
      .then(message => this.storeSendSms(message));
  }

  public async getSmsText(
    language: string,
    key: string,
    programId: number,
  ): Promise<string> {
    const program = await this.programService.findOne(programId);
    return program.notifications[language][key];
  }

  public storeSendSms(message) {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = message.accountSid;
    twilioMessage.body = message.body;
    twilioMessage.to = message.to;
    twilioMessage.from = message.from;
    twilioMessage.sid = message.sid;
    twilioMessage.status = message.status;
    twilioMessage.type = NotificationType.Sms;
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
