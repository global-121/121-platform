import { Injectable } from '@nestjs/common';
import { TWILIO } from '../../secrets';
import { twilioClient, twilio } from '../twilio.client';
import { Request, Response, NextFunction } from 'express';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fs from 'fs'
import { TWILIO_API } from '../../config';

@Injectable()
export class VoiceService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  public constructor() {}

  public notifyByVoice(
    recipientPhoneNr: string,
    language: string,
    key: string,
    programId: number,
  ): void {
    const mp3Param = programId.toString() + '%2F' + language + '%2F' + key;
    this.makeVoiceCall(mp3Param, recipientPhoneNr);
  }

  public makeVoiceCall(
    mp3Param: string,
    recipientPhoneNr: string,
  ) {
    // Overwrite recipient phone number for testing phase
    // recipientPhoneNr = TWILIO.testToNumber;
    twilioClient.calls
      .create({
        method: 'GET',
        url: TWILIO_API.voiceXmlUrl + mp3Param,
        to: recipientPhoneNr,
        statusCallback: TWILIO_API.callbackUrlVoice,
        from: TWILIO.testFromNumberVoice,
      })
      .then(call => this.storeCall(call, mp3Param))
      .catch(err => {
        console.log(err);
        // Do we need error handling here?
      });
  }

  public storeCall(call, mp3Param: string) {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = call.accountSid;
    twilioMessage.body = mp3Param;
    twilioMessage.to = call.to;
    twilioMessage.from = call.from;
    twilioMessage.sid = call.sid;
    twilioMessage.status = call.status;
    twilioMessage.type = NotificationType.Call;
    twilioMessage.dateCreated = new Date();
    this.twilioMessageRepository.save(twilioMessage);
  }

  public xmlResponse(mp3Param: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    const re = new RegExp('/', 'g');
    const mp3Escaped = mp3Param.replace(re, '%2F');
    const mp3Url = TWILIO_API.voiceMp3lUrl + mp3Escaped;
    twiml.play(mp3Url);
    return twiml.toString();
  }

  public returnMp3Stream(mp3Param) {
    const re = new RegExp('%2F', 'g');
    const subpath = mp3Param.replace(re, '/');
    const filePath = './voice/' + subpath + '.mp3';
    const stat = fs.statSync(filePath);
    const readStream = fs.createReadStream(filePath);
    return {'stat': stat, 'readStream': readStream};
  }

  public async statusCallback(callbackData) {
    await this.twilioMessageRepository.update(
      { sid: callbackData.CallSid },
      { status: callbackData.CallStatus },
    );
  }
}
