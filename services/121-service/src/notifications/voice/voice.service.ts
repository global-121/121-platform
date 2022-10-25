import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import fs from 'fs';
import { Repository } from 'typeorm';
import { EXTERNAL_API } from '../../config';
import { twilio, twilioClient } from '../twilio.client';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';

@Injectable()
export class VoiceService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  public constructor() {}

  public notifyByVoice(
    registrationId: number,
    recipientPhoneNr: string,
    language: string,
    key: string,
    programId: number,
  ): void {
    if (recipientPhoneNr) {
      const mp3Param =
        programId.toString() + 'REPLACE' + language + 'REPLACE' + key;
      this.makeVoiceCall(mp3Param, recipientPhoneNr, registrationId);
    }
  }

  public makeVoiceCall(
    mp3Param: string,
    recipientPhoneNr: string,
    registrationId: number,
  ): void {
    // Overwrite recipient phone number for testing phase
    // recipientPhoneNr = process.env.TWILIO_TEST_TO_NUMBER;
    twilioClient.calls
      .create({
        method: 'GET',
        url: EXTERNAL_API.voiceXmlUrl + mp3Param,
        to: recipientPhoneNr,
        statusCallback: EXTERNAL_API.voiceStatus,
        from: process.env.TWILIO_TEST_FROM_NUMBER_VOICE,
      })
      .then(call => this.storeCall(call, mp3Param, registrationId))
      .catch(err => {
        console.log(err);
        // Do we need error handling here?
      });
  }

  public storeCall(call, mp3Param: string, registrationId: number): void {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = call.accountSid;
    twilioMessage.body = mp3Param;
    twilioMessage.to = call.to;
    twilioMessage.from = call.from;
    twilioMessage.sid = call.sid;
    twilioMessage.status = call.status;
    twilioMessage.type = NotificationType.Call;
    twilioMessage.dateCreated = new Date();
    twilioMessage.registrationId = registrationId;
    this.twilioMessageRepository.save(twilioMessage);
  }

  public xmlResponse(mp3Param: string): any {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    const re = new RegExp('/', 'g');
    const mp3Escaped = mp3Param.replace(re, 'REPLACE');
    const mp3Url = EXTERNAL_API.voiceMp3Url + mp3Escaped;
    twiml.play(mp3Url);
    return twiml.toString();
  }

  public returnMp3Stream(mp3Param): any {
    const re = new RegExp('REPLACE', 'g');
    const subpath = mp3Param.replace(re, '/');
    const filePath = './voice/' + subpath + '.mp3';
    const stat = fs.statSync(filePath);
    const readStream = fs.createReadStream(filePath);
    return { stat: stat, readStream: readStream };
  }

  public async statusCallback(callbackData): Promise<void> {
    await this.twilioMessageRepository.update(
      { sid: callbackData.CallSid },
      { status: callbackData.CallStatus },
    );
  }
}
